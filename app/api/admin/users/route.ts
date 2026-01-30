import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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
 * GET /api/admin/users - Get all users with pagination and search
 */
export async function GET(request: NextRequest) {
    const authResult = await verifyAdmin(request);
    if ('error' in authResult) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';
        const status = searchParams.get('status') || '';
        const limit = parseInt(searchParams.get('limit') || '10');
        const page = parseInt(searchParams.get('page') || '1');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Build query
        const query: any = {};

        // Search filter
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { businessName: { $regex: search, $options: 'i' } },
            ];
        }

        // Role filter
        if (role && ['photographer', 'client', 'admin'].includes(role)) {
            query.role = role;
        }

        // Status filter
        if (status && ['active', 'suspended', 'banned'].includes(status)) {
            query.status = status;
        }

        // Build sort object
        const sort: any = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Get total count
        const total = await User.countDocuments(query);

        // Get paginated users
        const users = await User.find(query)
            .select('-password')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return NextResponse.json({
            users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total,
            },
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/users - Create a new user (admin can create any role)
 */
export async function POST(request: NextRequest) {
    const authResult = await verifyAdmin(request);
    if ('error' in authResult) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        const body = await request.json();
        const {
            phone,
            email,
            password,
            fullName,
            businessName,
            userType,
            role,
            status
        } = body;

        // Validate required fields
        if (!phone) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        if (!userType || !['photographer', 'studio_owner'].includes(userType)) {
            return NextResponse.json(
                { error: 'Valid user type is required (photographer or studio_owner)' },
                { status: 400 }
            );
        }

        // Validate phone format
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return NextResponse.json(
                { error: 'Invalid phone number format' },
                { status: 400 }
            );
        }

        // Check if phone already exists
        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return NextResponse.json(
                { error: 'Phone number already registered' },
                { status: 409 }
            );
        }

        // Check if email already exists (if provided)
        if (email) {
            const existingEmail = await User.findOne({ email: email.toLowerCase() });
            if (existingEmail) {
                return NextResponse.json(
                    { error: 'Email already registered' },
                    { status: 409 }
                );
            }
        }

        // Create user data
        const userData: any = {
            phone,
            userType,
            isVerified: true, // Admin-created users are verified
            role: role || 'photographer',
            status: status || 'active',
        };

        if (email) userData.email = email.toLowerCase();
        if (fullName) userData.fullName = fullName;
        if (businessName) userData.businessName = businessName;
        if (password && password.trim().length > 0) {
            userData.password = password; // Will be hashed by pre-save hook
        }

        const user = await User.create(userData);

        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;

        return NextResponse.json(
            { message: 'User created successfully', user: userResponse },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating user:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err: any) => err.message);
            return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
        }

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return NextResponse.json({ error: `${field} already exists` }, { status: 409 });
        }

        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        );
    }
}
