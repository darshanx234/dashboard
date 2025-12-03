import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { WalletService } from '@/lib/services/wallet.service';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Get transaction history
    const result = await WalletService.getTransactionHistory(
      decoded.userId,
      limit,
      skip
    );

    return NextResponse.json({
      success: true,
      transactions: result.transactions.map((transaction) => ({
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        balanceBefore: transaction.balanceBefore,
        balanceAfter: transaction.balanceAfter,
        category: transaction.category,
        description: transaction.description,
        metadata: transaction.metadata,
        status: transaction.status,
        createdAt: transaction.createdAt,
      })),
      total: result.total,
      hasMore: skip + limit < result.total,
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
