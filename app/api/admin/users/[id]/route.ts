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
 * GET /api/admin/users/[id] - Get single user details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await verifyAdmin(request);
    if ('error' in authResult) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        const { id } = await params;

        const user = await User.findById(id).select('-password').lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/users/[id] - Update user
 */
export async function PUT(
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

        const {
            fullName,
            businessName,
            email,
            phone,
            userType,
            role,
            bio,
            avatar
        } = body;

        // Check if user exists
        const existingUser = await User.findById(id);
        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check for duplicate email if changed
        if (email && email !== existingUser.email) {
            const emailExists = await User.findOne({
                email: email.toLowerCase(),
                _id: { $ne: id }
            });
            if (emailExists) {
                return NextResponse.json(
                    { error: 'Email already in use' },
                    { status: 409 }
                );
            }
        }

        // Check for duplicate phone if changed
        if (phone && phone !== existingUser.phone) {
            const phoneExists = await User.findOne({
                phone,
                _id: { $ne: id }
            });
            if (phoneExists) {
                return NextResponse.json(
                    { error: 'Phone number already in use' },
                    { status: 409 }
                );
            }
        }

        // Build update object
        const updateData: any = { updatedAt: new Date() };

        if (fullName !== undefined) updateData.fullName = fullName;
        if (businessName !== undefined) updateData.businessName = businessName;
        if (email !== undefined) updateData.email = email?.toLowerCase();
        if (phone !== undefined) updateData.phone = phone;
        if (userType !== undefined) updateData.userType = userType;
        if (role !== undefined) updateData.role = role;
        if (bio !== undefined) updateData.bio = bio;
        if (avatar !== undefined) updateData.avatar = avatar;

        const user = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password').lean();

        return NextResponse.json({
            message: 'User updated successfully',
            user
        });
    } catch (error: any) {
        console.error('Error updating user:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err: any) => err.message);
            return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
        }

        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/users/[id] - Delete user
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await verifyAdmin(request);
    if ('error' in authResult) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        const { id } = await params;

        // Prevent self-deletion
        if (id === authResult.userId) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}
