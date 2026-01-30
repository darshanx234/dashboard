'use client';

import { Badge } from '@/components/ui/badge';

export type UserRole = 'photographer' | 'client' | 'admin';

interface UserRoleBadgeProps {
    role?: UserRole;
}

const roleConfig: Record<UserRole, { label: string; className: string }> = {
    photographer: {
        label: 'Photographer',
        className: 'bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-500/20',
    },
    client: {
        label: 'Client',
        className: 'bg-purple-500/15 text-purple-600 hover:bg-purple-500/25 border-purple-500/20',
    },
    admin: {
        label: 'Admin',
        className: 'bg-orange-500/15 text-orange-600 hover:bg-orange-500/25 border-orange-500/20',
    },
};

export function UserRoleBadge({ role = 'photographer' }: UserRoleBadgeProps) {
    const config = roleConfig[role] || roleConfig.photographer;

    return (
        <Badge variant="outline" className={config.className}>
            {config.label}
        </Badge>
    );
}
