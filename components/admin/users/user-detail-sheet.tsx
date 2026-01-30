'use client';

import { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserStatusBadge } from './user-status-badge';
import { UserRoleBadge } from './user-role-badge';
import { adminUserApi, AdminUser, UserStatsResponse } from '@/lib/api/admin-users';
import { formatDistanceToNow, format } from 'date-fns';
import {
    Loader2,
    Image,
    HardDrive,
    Wallet,
    Eye,
    Download,
    Heart,
    Calendar,
    Phone,
    Mail,
    Building2,
    TrendingUp,
    TrendingDown,
    Folder
} from 'lucide-react';

interface UserDetailSheetProps {
    user: AdminUser | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    return user.phone?.slice(-2) || 'U';
}

export function UserDetailSheet({ user, open, onOpenChange }: UserDetailSheetProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<UserStatsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && user) {
            loadUserStats();
        } else {
            setStats(null);
            setError(null);
        }
    }, [open, user]);

    const loadUserStats = async () => {
        if (!user) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await adminUserApi.getUserStats(user._id);
            setStats(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load user stats');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[540px] p-0">
                <ScrollArea className="h-full">
                    <div className="p-6">
                        <SheetHeader className="space-y-4">
                            {/* User Profile Header */}
                            <div className="flex items-start gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={user.avatar} alt={user.fullName || 'User'} />
                                    <AvatarFallback className="text-lg">{getInitials(user)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <SheetTitle className="text-xl">
                                        {user.fullName || user.businessName || 'Unnamed User'}
                                    </SheetTitle>
                                    <SheetDescription className="mt-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <UserRoleBadge role={user.role} />
                                            <UserStatusBadge status={user.status} />
                                        </div>
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>

                        {/* Contact Info */}
                        <div className="mt-6 space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{user.phone}</span>
                            </div>
                            {user.email && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{user.email}</span>
                                </div>
                            )}
                            {user.businessName && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span>{user.businessName}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Stats Loading/Error */}
                        {isLoading && (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        )}

                        {error && (
                            <div className="text-center py-8 text-sm text-red-500">
                                {error}
                            </div>
                        )}

                        {/* Stats Content */}
                        {stats && !isLoading && (
                            <div className="space-y-6">
                                {/* Wallet */}
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Wallet</h3>
                                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                                <Wallet className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold">
                                                    {stats.stats.wallet.balance.toLocaleString()}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {stats.stats.wallet.currency}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Album Stats */}
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Albums</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <StatCard
                                            icon={<Folder className="h-4 w-4" />}
                                            label="Total Albums"
                                            value={stats.stats.albums.totalAlbums}
                                            iconBg="bg-purple-500/10"
                                            iconColor="text-purple-600"
                                        />
                                        <StatCard
                                            icon={<Image className="h-4 w-4" />}
                                            label="Total Photos"
                                            value={stats.stats.photos.totalPhotos}
                                            iconBg="bg-green-500/10"
                                            iconColor="text-green-600"
                                        />
                                        <StatCard
                                            icon={<HardDrive className="h-4 w-4" />}
                                            label="Storage Used"
                                            value={formatBytes(stats.stats.albums.totalStorageUsed)}
                                            iconBg="bg-orange-500/10"
                                            iconColor="text-orange-600"
                                        />
                                        <StatCard
                                            icon={<Eye className="h-4 w-4" />}
                                            label="Total Views"
                                            value={stats.stats.albums.totalViews}
                                            iconBg="bg-blue-500/10"
                                            iconColor="text-blue-600"
                                        />
                                    </div>
                                </div>

                                {/* Album Status Breakdown */}
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Album Status</h3>
                                    <div className="flex gap-2 flex-wrap">
                                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                            Published: {stats.stats.albums.publishedAlbums}
                                        </Badge>
                                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                            Draft: {stats.stats.albums.draftAlbums}
                                        </Badge>
                                        <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">
                                            Archived: {stats.stats.albums.archivedAlbums}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Engagement Stats */}
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Engagement</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center p-3 rounded-lg bg-muted/50">
                                            <Download className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                            <p className="text-lg font-semibold">{stats.stats.photos.totalDownloads}</p>
                                            <p className="text-xs text-muted-foreground">Downloads</p>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-muted/50">
                                            <Heart className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                            <p className="text-lg font-semibold">{stats.stats.photos.totalFavorites}</p>
                                            <p className="text-xs text-muted-foreground">Favorites</p>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-muted/50">
                                            <Eye className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                            <p className="text-lg font-semibold">{stats.stats.photos.totalViews}</p>
                                            <p className="text-xs text-muted-foreground">Photo Views</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Albums */}
                                {stats.recentAlbums.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Albums</h3>
                                        <div className="space-y-2">
                                            {stats.recentAlbums.map((album) => (
                                                <div
                                                    key={album._id}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                                >
                                                    <div>
                                                        <p className="font-medium text-sm">{album.title}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {album.totalPhotos} photos • {formatBytes(album.storageUsed)}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            album.status === 'published'
                                                                ? 'bg-green-500/10 text-green-600'
                                                                : album.status === 'draft'
                                                                    ? 'bg-yellow-500/10 text-yellow-600'
                                                                    : 'bg-gray-500/10 text-gray-600'
                                                        }
                                                    >
                                                        {album.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recent Transactions */}
                                {stats.recentTransactions.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Transactions</h3>
                                        <div className="space-y-2">
                                            {stats.recentTransactions.map((tx) => (
                                                <div
                                                    key={tx._id}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-1.5 rounded-full ${tx.type === 'credit'
                                                                ? 'bg-green-500/10'
                                                                : 'bg-red-500/10'
                                                            }`}>
                                                            {tx.type === 'credit' ? (
                                                                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                                                            ) : (
                                                                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">{tx.description}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

// Stat Card Component
function StatCard({
    icon,
    label,
    value,
    iconBg,
    iconColor
}: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    iconBg: string;
    iconColor: string;
}) {
    return (
        <div className="p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded ${iconBg}`}>
                    <span className={iconColor}>{icon}</span>
                </div>
            </div>
            <p className="text-lg font-semibold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    );
}
