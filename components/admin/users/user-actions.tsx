'use client';

import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    MoreHorizontal,
    Pencil,
    Ban,
    UserCheck,
    UserX,
    Trash2,
    Loader2
} from 'lucide-react';
import { AdminUser } from '@/lib/api/admin-users';

type UserStatus = 'active' | 'suspended' | 'banned';

interface UserActionsProps {
    user: AdminUser;
    onEdit: (user: AdminUser) => void;
    onStatusChange: (userId: string, status: UserStatus) => Promise<void>;
    onDelete: (userId: string) => Promise<void>;
    isCurrentUser?: boolean;
}

export function UserActions({
    user,
    onEdit,
    onStatusChange,
    onDelete,
    isCurrentUser = false
}: UserActionsProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<UserStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleStatusClick = (status: UserStatus) => {
        setPendingStatus(status);
        setShowStatusDialog(true);
    };

    const confirmStatusChange = async () => {
        if (!pendingStatus) return;

        setIsLoading(true);
        try {
            await onStatusChange(user._id, pendingStatus);
        } finally {
            setIsLoading(false);
            setShowStatusDialog(false);
            setPendingStatus(null);
        }
    };

    const confirmDelete = async () => {
        setIsLoading(true);
        try {
            await onDelete(user._id);
        } finally {
            setIsLoading(false);
            setShowDeleteDialog(false);
        }
    };

    const statusMessages: Record<UserStatus, { title: string; description: string }> = {
        active: {
            title: 'Activate User',
            description: `Are you sure you want to activate ${user.fullName || user.phone}? They will regain full access to their account.`,
        },
        suspended: {
            title: 'Suspend User',
            description: `Are you sure you want to suspend ${user.fullName || user.phone}? They will temporarily lose access to their account.`,
        },
        banned: {
            title: 'Ban User',
            description: `Are you sure you want to ban ${user.fullName || user.phone}? This will permanently restrict their account.`,
        },
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>

                    {!isCurrentUser && (
                        <>
                            <DropdownMenuSeparator />

                            {user.status !== 'active' && (
                                <DropdownMenuItem onClick={() => handleStatusClick('active')}>
                                    <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                                    Activate
                                </DropdownMenuItem>
                            )}

                            {user.status !== 'suspended' && (
                                <DropdownMenuItem onClick={() => handleStatusClick('suspended')}>
                                    <UserX className="mr-2 h-4 w-4 text-yellow-600" />
                                    Suspend
                                </DropdownMenuItem>
                            )}

                            {user.status !== 'banned' && (
                                <DropdownMenuItem onClick={() => handleStatusClick('banned')}>
                                    <Ban className="mr-2 h-4 w-4 text-red-600" />
                                    Ban
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onClick={() => setShowDeleteDialog(true)}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Status Change Confirmation Dialog */}
            <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingStatus && statusMessages[pendingStatus].title}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingStatus && statusMessages[pendingStatus].description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmStatusChange}
                            disabled={isLoading}
                            className={
                                pendingStatus === 'banned'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : pendingStatus === 'suspended'
                                        ? 'bg-yellow-600 hover:bg-yellow-700'
                                        : ''
                            }
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {user.fullName || user.phone}?
                            This action cannot be undone and will permanently remove their account and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isLoading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
