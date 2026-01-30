'use client';

import { Badge } from '@/components/ui/badge';

export type UserStatus = 'active' | 'suspended' | 'banned';

interface UserStatusBadgeProps {
    status?: UserStatus;
}

const statusConfig: Record<UserStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
    active: {
        label: 'Active',
        variant: 'default',
        className: 'bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-500/20',
    },
    suspended: {
        label: 'Suspended',
        variant: 'secondary',
        className: 'bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25 border-yellow-500/20',
    },
    banned: {
        label: 'Banned',
        variant: 'destructive',
        className: 'bg-red-500/15 text-red-600 hover:bg-red-500/25 border-red-500/20',
    },
};

export function UserStatusBadge({ status = 'active' }: UserStatusBadgeProps) {
    const config = statusConfig[status] || statusConfig.active;

    return (
        <Badge variant="outline" className={config.className}>
            {config.label}
        </Badge>
    );
}
