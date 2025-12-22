'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { HardDrive, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StorageInfo {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
    usedFormatted: string;
    limitFormatted: string;
    remainingFormatted: string;
}

interface StorageIndicatorProps {
    storageInfo: StorageInfo;
    albumTitle?: string;
    className?: string;
    compact?: boolean;
}

export function StorageIndicator({
    storageInfo,
    albumTitle,
    className,
    compact = false,
}: StorageIndicatorProps) {
    const { percentage, usedFormatted, limitFormatted, remainingFormatted } = storageInfo;

    // Determine color based on usage
    const getStatusColor = () => {
        if (percentage < 70) return 'text-green-600';
        if (percentage < 90) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getProgressColor = () => {
        if (percentage < 70) return 'bg-green-600';
        if (percentage < 90) return 'bg-yellow-600';
        return 'bg-red-600';
    };

    if (compact) {
        return (
            <div className={cn('space-y-2', className)}>
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Storage</span>
                    </div>
                    <span className={cn('font-semibold', getStatusColor())}>
                        {percentage.toFixed(1)}%
                    </span>
                </div>
                <Progress value={percentage} className="h-2" indicatorClassName={getProgressColor()} />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{usedFormatted} used</span>
                    <span>{remainingFormatted} remaining</span>
                </div>
            </div>
        );
    }

    return (
        <Card className={className}>
            <CardContent className="p-6">
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <HardDrive className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold">Storage Usage</h3>
                        </div>
                        {percentage >= 90 && (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        )}
                    </div>

                    {albumTitle && (
                        <p className="text-sm text-muted-foreground">{albumTitle}</p>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <Progress
                            value={percentage}
                            className="h-3"
                            indicatorClassName={getProgressColor()}
                        />
                        <div className="flex justify-between items-center">
                            <span className={cn('text-2xl font-bold', getStatusColor())}>
                                {percentage.toFixed(1)}%
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {usedFormatted} of {limitFormatted}
                            </span>
                        </div>
                    </div>

                    {/* Storage Details */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                            <div className="text-sm text-muted-foreground">Used</div>
                            <div className="text-lg font-semibold">{usedFormatted}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Remaining</div>
                            <div className="text-lg font-semibold">{remainingFormatted}</div>
                        </div>
                    </div>

                    {/* Warning Messages */}
                    {percentage >= 90 && (
                        <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                                ⚠️ Storage almost full! You have only {remainingFormatted} remaining.
                            </p>
                        </div>
                    )}
                    {percentage >= 70 && percentage < 90 && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                                ⚠️ Storage usage is high. {remainingFormatted} remaining.
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
