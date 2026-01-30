import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Helper to verify admin role
 */
async function verifyAdmin(request: NextRequest) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
        return { error: 'Unauthorized', status: 401 };
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        await connectToDatabase();
        const user = await User.findById(decoded.userId).select('role');

        if (!user || user.role !== 'admin') {
            return { error: 'Admin access required', status: 403 };
        }

        return { userId: decoded.userId, user };
    } catch (error) {
        return { error: 'Invalid token', status: 401 };
    }
}

/**
 * PATCH /api/admin/users/[id]/status - Update user status
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await verifyAdmin(request);
    if ('error' in authResult) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        // Validate status
        const validStatuses = ['active', 'suspended', 'banned'];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be one of: active, suspended, banned' },
                { status: 400 }
            );
        }

        // Prevent changing own status
        if (id === authResult.userId) {
            return NextResponse.json(
                { error: 'Cannot change your own status' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await User.findById(id);
        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update status
        const user = await User.findByIdAndUpdate(
            id,
            {
                $set: {
                    status,
                    updatedAt: new Date()
                }
            },
            { new: true }
        ).select('-password').lean();

        // Status action message
        const actionMessages: Record<string, string> = {
            active: 'User has been activated',
            suspended: 'User has been suspended',
            banned: 'User has been banned',
        };

        return NextResponse.json({
            message: actionMessages[status],
            user
        });
    } catch (error) {
        console.error('Error updating user status:', error);
        return NextResponse.json(
            { error: 'Failed to update user status' },
            { status: 500 }
        );
    }
}
