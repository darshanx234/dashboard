'use client';

import { AdminUser } from '@/lib/api/admin-users';
import { UserStatusBadge } from './user-status-badge';
import { UserRoleBadge } from './user-role-badge';
import { UserActions } from './user-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface UserTableProps {
    users: AdminUser[];
    currentUserId?: string;
    onEdit: (user: AdminUser) => void;
    onStatusChange: (userId: string, status: 'active' | 'suspended' | 'banned') => Promise<void>;
    onDelete: (userId: string) => Promise<void>;
    isLoading?: boolean;
}

function getInitials(user: AdminUser): string {
    if (user.fullName) {
        return user.fullName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }
    if (user.firstName && user.lastName) {
        return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.phone?.slice(-2) || 'U';
}

export function UserTable({
    users,
    currentUserId,
    onEdit,
    onStatusChange,
    onDelete,
    isLoading
}: UserTableProps) {
    if (isLoading) {
        return (
            <div className="border rounded-lg">
                <div className="p-8 text-center text-muted-foreground">
                    Loading users...
                </div>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="border rounded-lg">
                <div className="p-8 text-center text-muted-foreground">
                    No users found
                </div>
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left p-4 font-medium text-sm">User</th>
                            <th className="text-left p-4 font-medium text-sm">Phone</th>
                            <th className="text-left p-4 font-medium text-sm">Role</th>
                            <th className="text-left p-4 font-medium text-sm">Status</th>
                            <th className="text-left p-4 font-medium text-sm">Joined</th>
                            <th className="text-right p-4 font-medium text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users.map((user) => (
                            <tr key={user._id} className="hover:bg-muted/30 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={user.avatar} alt={user.fullName || 'User'} />
                                            <AvatarFallback>{getInitials(user)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">
                                                {user.fullName || user.businessName || 'Unnamed User'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {user.email || 'No email'}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-sm">{user.phone}</td>
                                <td className="p-4">
                                    <UserRoleBadge role={user.role} />
                                </td>
                                <td className="p-4">
                                    <UserStatusBadge status={user.status} />
                                </td>
                                <td className="p-4 text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                                </td>
                                <td className="p-4 text-right">
                                    <UserActions
                                        user={user}
                                        onEdit={onEdit}
                                        onStatusChange={onStatusChange}
                                        onDelete={onDelete}
                                        isCurrentUser={user._id === currentUserId}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
                {users.map((user) => (
                    <div key={user._id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={user.avatar} alt={user.fullName || 'User'} />
                                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">
                                        {user.fullName || user.businessName || 'Unnamed User'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{user.phone}</p>
                                </div>
                            </div>
                            <UserActions
                                user={user}
                                onEdit={onEdit}
                                onStatusChange={onStatusChange}
                                onDelete={onDelete}
                                isCurrentUser={user._id === currentUserId}
                            />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <UserRoleBadge role={user.role} />
                            <UserStatusBadge status={user.status} />
                        </div>

                        <div className="text-sm text-muted-foreground">
                            {user.email && <p>{user.email}</p>}
                            <p>Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
