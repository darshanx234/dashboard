import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { AlbumPlanService } from '@/lib/services/album-plan.service';

// GET /api/album-plans - Get all available album plans
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const plans = await AlbumPlanService.getAllPlans();

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error: any) {
    console.error('Get Album Plans Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch album plans',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
