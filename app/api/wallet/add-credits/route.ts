import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { WalletService } from '@/lib/services/wallet.service';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get token from cookie
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { amount, description } = body;

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Add credits
    const result = await WalletService.addCredits({
      userId: decoded.userId,
      amount,
      category: 'manual_add',
      description,
    });

    return NextResponse.json({
      success: true,
      message: 'Credits added successfully',
      wallet: {
        balance: result.wallet.balance,
      },
      transaction: {
        id: result.transaction._id,
        amount: result.transaction.amount,
        type: result.transaction.type,
        balanceAfter: result.transaction.balanceAfter,
        createdAt: result.transaction.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error adding credits:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
