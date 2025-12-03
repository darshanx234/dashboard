import mongoose from 'mongoose';
import Wallet, { IWallet } from '@/lib/models/Wallet';
import Transaction, { ITransaction } from '@/lib/models/Transaction';

export interface CreateWalletParams {
  userId: mongoose.Types.ObjectId | string;
  initialBalance?: number;
}

export interface AddCreditsParams {
  userId: mongoose.Types.ObjectId | string;
  amount: number;
  category: 'signup_bonus' | 'manual_add' | 'refund' | 'other';
  description: string;
  metadata?: any;
}

export interface DeductCreditsParams {
  userId: mongoose.Types.ObjectId | string;
  amount: number;
  category: 'album_creation' | 'other';
  description: string;
  metadata?: any;
}

export class WalletService {
  /**
   * Create a new wallet for a user
   */
  static async createWallet({ userId, initialBalance = 0 }: CreateWalletParams): Promise<IWallet> {
    try {
      const wallet = await Wallet.create({
        userId,
        balance: initialBalance,
      });

      // If there's an initial balance, create a transaction record
      if (initialBalance > 0) {
        await Transaction.create({
          userId,
          walletId: wallet._id,
          type: 'credit',
          amount: initialBalance,
          balanceBefore: 0,
          balanceAfter: initialBalance,
          category: 'signup_bonus',
          description: 'Welcome bonus',
          status: 'completed',
        });
      }

      return wallet;
    } catch (error: any) {
      console.error('Error creating wallet:', error);
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet by user ID
   */
  static async getWalletByUserId(userId: mongoose.Types.ObjectId | string): Promise<IWallet | null> {
    try {
      const wallet = await Wallet.findOne({ userId, isActive: true });
      return wallet;
    } catch (error: any) {
      console.error('Error fetching wallet:', error);
      throw new Error(`Failed to fetch wallet: ${error.message}`);
    }
  }

  /**
   * Add credits to wallet
   */
  static async addCredits({
    userId,
    amount,
    category,
    description,
    metadata = {},
  }: AddCreditsParams): Promise<{ wallet: IWallet; transaction: ITransaction }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get wallet
      const wallet = await Wallet.findOne({ userId, isActive: true }).session(session);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + amount;

      // Update wallet balance
      wallet.balance = balanceAfter;
      await wallet.save({ session });

      // Create transaction record
      const transaction = await Transaction.create(
        [
          {
            userId,
            walletId: wallet._id,
            type: 'credit',
            amount,
            balanceBefore,
            balanceAfter,
            category,
            description,
            metadata,
            status: 'completed',
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return { wallet, transaction: transaction[0] };
    } catch (error: any) {
      await session.abortTransaction();
      console.error('Error adding credits:', error);
      throw new Error(`Failed to add credits: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Deduct credits from wallet
   */
  static async deductCredits({
    userId,
    amount,
    category,
    description,
    metadata = {},
  }: DeductCreditsParams): Promise<{ wallet: IWallet; transaction: ITransaction }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get wallet
      const wallet = await Wallet.findOne({ userId, isActive: true }).session(session);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore - amount;

      // Check if sufficient balance
      if (balanceAfter < 0) {
        throw new Error('Insufficient credits');
      }

      // Update wallet balance
      wallet.balance = balanceAfter;
      await wallet.save({ session });

      // Create transaction record
      const transaction = await Transaction.create(
        [
          {
            userId,
            walletId: wallet._id,
            type: 'debit',
            amount,
            balanceBefore,
            balanceAfter,
            category,
            description,
            metadata,
            status: 'completed',
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return { wallet, transaction: transaction[0] };
    } catch (error: any) {
      await session.abortTransaction();
      console.error('Error deducting credits:', error);
      throw new Error(`Failed to deduct credits: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Get transaction history
   */
  static async getTransactionHistory(
    userId: mongoose.Types.ObjectId | string,
    limit = 50,
    skip = 0
  ): Promise<{ transactions: ITransaction[]; total: number }> {
    try {
      const [transactions, total] = await Promise.all([
        Transaction.find({ userId })
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        Transaction.countDocuments({ userId }),
      ]);

      return { transactions: transactions as ITransaction[], total };
    } catch (error: any) {
      console.error('Error fetching transaction history:', error);
      throw new Error(`Failed to fetch transaction history: ${error.message}`);
    }
  }

  /**
   * Get wallet balance
   */
  static async getBalance(userId: mongoose.Types.ObjectId | string): Promise<number> {
    try {
      const wallet = await Wallet.findOne({ userId, isActive: true });
      return wallet ? wallet.balance : 0;
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      throw new Error(`Failed to fetch balance: ${error.message}`);
    }
  }

  /**
   * Check if user has sufficient credits
   */
  static async hasSufficientCredits(
    userId: mongoose.Types.ObjectId | string,
    amount: number
  ): Promise<boolean> {
    try {
      const balance = await this.getBalance(userId);
      return balance >= amount;
    } catch (error: any) {
      console.error('Error checking credits:', error);
      return false;
    }
  }
}
