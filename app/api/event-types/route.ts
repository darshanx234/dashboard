import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import EventType from '@/lib/models/EventTypes';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const eventTypes = await EventType.find({}).sort({ eventtypename: 1 });

    return NextResponse.json({
      success: true,
      eventTypes,
    });
  } catch (error: any) {
    console.error('Fetch event types error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch event types',
      },
      { status: 500 }
    );
  }
}
