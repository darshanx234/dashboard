import mongoose from 'mongoose';
import AlbumPlan, { IAlbumPlan } from '@/lib/models/AlbumPlan';
import Album from '@/lib/models/Album';
import Wallet from '@/lib/models/Wallet';
import { gbToBytes } from '@/lib/utils/storage-utils';

export interface PlanValidationResult {
  isValid: boolean;
  plan?: IAlbumPlan;
  error?: string;
  userBalance?: number;
}

export class AlbumPlanService {
  /**
   * Get all active album plans sorted by display order
   */
  static async getAllPlans(): Promise<IAlbumPlan[]> {
    try {
      const plans = await AlbumPlan.find({ isActive: true })
        .sort({ displayOrder: 1, price: 1 })
        .lean();
      
      return plans as IAlbumPlan[];
    } catch (error: any) {
      console.error('Error fetching album plans:', error);
      throw new Error(`Failed to fetch album plans: ${error.message}`);
    }
  }

  /**
   * Get a specific plan by ID
   */
  static async getPlanById(planId: mongoose.Types.ObjectId | string): Promise<IAlbumPlan | null> {
    try {
      const plan = await AlbumPlan.findById(planId).lean();
      return plan as IAlbumPlan | null;
    } catch (error: any) {
      console.error('Error fetching plan:', error);
      throw new Error(`Failed to fetch plan: ${error.message}`);
    }
  }

  /**
   * Validate if user can select a plan (check wallet balance)
   */
  static async validatePlanSelection(
    planId: mongoose.Types.ObjectId | string,
    userId: mongoose.Types.ObjectId | string
  ): Promise<PlanValidationResult> {
    try {
      // Get plan
      const plan = await AlbumPlan.findById(planId);
      if (!plan) {
        return {
          isValid: false,
          error: 'Plan not found',
        };
      }

      if (!plan.isActive) {
        return {
          isValid: false,
          error: 'This plan is no longer available',
        };
      }

      // Get user wallet
      const wallet = await Wallet.findOne({ userId, isActive: true });
      if (!wallet) {
        return {
          isValid: false,
          error: 'Wallet not found',
          userBalance: 0,
        };
      }

      // Check if user has sufficient balance
      if (wallet.balance < plan.price) {
        return {
          isValid: false,
          error: `Insufficient credits. Required: ₹${plan.price}, Available: ₹${wallet.balance}`,
          userBalance: wallet.balance,
          plan: plan.toObject() as IAlbumPlan,
        };
      }

      return {
        isValid: true,
        plan: plan.toObject() as IAlbumPlan,
        userBalance: wallet.balance,
      };
    } catch (error: any) {
      console.error('Error validating plan selection:', error);
      throw new Error(`Failed to validate plan selection: ${error.message}`);
    }
  }

  /**
   * Initialize default album plans (run once during setup)
   */
  static async initializeDefaultPlans(): Promise<void> {
    try {
      const existingPlans = await AlbumPlan.countDocuments();
      if (existingPlans > 0) {
        console.log('Plans already exist, skipping initialization');
        return;
      }

      const defaultPlans = [
        {
          name: 'Basic',
          description: 'Perfect for small events and personal collections',
          price: 99,
          storageLimit: gbToBytes(25),
          storageLimitGB: 25,
          durationDays: 365,
          features: [
            '25 GB storage',
            '1 year validity',
            'Unlimited photo uploads',
            'Basic sharing options',
          ],
          isActive: true,
          displayOrder: 1,
          isRecommended: false,
        },
        {
          name: 'Standard',
          description: 'Ideal for medium-sized events and weddings',
          price: 149,
          storageLimit: gbToBytes(50),
          storageLimitGB: 50,
          durationDays: 365,
          features: [
            '50 GB storage',
            '1 year validity',
            'Unlimited photo uploads',
            'Advanced sharing options',
            'Download tracking',
          ],
          isActive: true,
          displayOrder: 2,
          isRecommended: true,
        },
        {
          name: 'Premium',
          description: 'Great for large events and professional portfolios',
          price: 199,
          storageLimit: gbToBytes(100),
          storageLimitGB: 100,
          durationDays: 365,
          features: [
            '100 GB storage',
            '1 year validity',
            'Unlimited photo uploads',
            'Advanced sharing options',
            'Download tracking',
            'Priority support',
          ],
          isActive: true,
          displayOrder: 3,
          isRecommended: false,
        },
        {
          name: 'Enterprise',
          description: 'For extensive collections and studio archives',
          price: 249,
          storageLimit: gbToBytes(200),
          storageLimitGB: 200,
          durationDays: 365,
          features: [
            '200 GB storage',
            '1 year validity',
            'Unlimited photo uploads',
            'Advanced sharing options',
            'Download tracking',
            'Priority support',
            'Custom branding',
          ],
          isActive: true,
          displayOrder: 4,
          isRecommended: false,
        },
      ];

      await AlbumPlan.insertMany(defaultPlans);
      console.log('Default album plans initialized successfully');
    } catch (error: any) {
      console.error('Error initializing default plans:', error);
      throw new Error(`Failed to initialize default plans: ${error.message}`);
    }
  }
}
