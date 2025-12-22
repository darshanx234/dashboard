import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { AlbumPlanService } from '@/lib/services/album-plan.service';

// POST /api/album-plans/init - Initialize default album plans
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Initialize default plans
    await AlbumPlanService.initializeDefaultPlans();

    // Get all plans to return
    const plans = await AlbumPlanService.getAllPlans();

    return NextResponse.json({
      success: true,
      message: 'Album plans initialized successfully',
      plans,
    });
  } catch (error: any) {
    console.error('Initialize Album Plans Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to initialize album plans',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
