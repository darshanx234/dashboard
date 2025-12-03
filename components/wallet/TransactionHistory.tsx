'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowUpCircle,
    ArrowDownCircle,
    Calendar,
    FileText,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Transaction {
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    category: string;
    description: string;
    metadata?: any;
    status: string;
    createdAt: string;
}

interface TransactionHistoryProps {
    className?: string;
    limit?: number;
}

export function TransactionHistory({ className, limit = 20 }: TransactionHistoryProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, [skip]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/wallet/transactions?limit=${limit}&skip=${skip}`);
            const data = await response.json();

            if (response.ok) {
                setTransactions(data.transactions);
                setTotal(data.total);
                setHasMore(data.hasMore);
            } else {
                setError(data.error || 'Failed to fetch transactions');
            }
        } catch (err) {
            setError('Failed to fetch transactions');
            console.error('Error fetching transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'signup_bonus':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'manual_add':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'album_creation':
                return 'bg-purple-100 text-purple-800 border-purple-300';
            case 'refund':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getCategoryLabel = (category: string) => {
        return category.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    if (loading && transactions.length === 0) {
        return (
            <Card className={cn('overflow-hidden', className)}>
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
                    <CardTitle className="text-2xl font-bold">Transaction History</CardTitle>
                    <CardDescription>Loading your transactions...</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="animate-pulse flex items-center gap-4">
                                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                                <div className="h-6 w-20 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={cn('overflow-hidden border-red-200', className)}>
                <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
                    <CardTitle className="text-2xl font-bold text-red-900">Transaction History</CardTitle>
                    <CardDescription className="text-red-700">Error loading transactions</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={fetchTransactions} variant="outline" className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('overflow-hidden shadow-lg', className)}>
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold">Transaction History</CardTitle>
                        <CardDescription>
                            {total > 0 ? `${total} total transaction${total !== 1 ? 's' : ''}` : 'No transactions yet'}
                        </CardDescription>
                    </div>
                    <Button
                        onClick={fetchTransactions}
                        variant="ghost"
                        size="sm"
                        disabled={loading}
                        className="hover:bg-white"
                    >
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {transactions.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
                        <p className="text-gray-600">Your transaction history will appear here</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {transactions.map((transaction, index) => (
                            <div
                                key={transaction.id}
                                className={cn(
                                    'p-4 hover:bg-gray-50 transition-colors duration-150',
                                    index === 0 && 'bg-gradient-to-r from-purple-50/50 to-transparent'
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={cn(
                                        'flex-shrink-0 p-3 rounded-xl',
                                        transaction.type === 'credit'
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-red-100 text-red-600'
                                    )}>
                                        {transaction.type === 'credit' ? (
                                            <ArrowUpCircle className="h-5 w-5" />
                                        ) : (
                                            <ArrowDownCircle className="h-5 w-5" />
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <div>
                                                <p className="font-semibold text-gray-900 truncate">
                                                    {transaction.description}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn('text-xs font-medium', getCategoryColor(transaction.category))}
                                                    >
                                                        {getCategoryLabel(transaction.category)}
                                                    </Badge>
                                                    {transaction.metadata?.albumTitle && (
                                                        <span className="text-xs text-gray-500 truncate">
                                                            {transaction.metadata.albumTitle}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className={cn(
                                                    'text-lg font-bold',
                                                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                                )}>
                                                    {transaction.type === 'credit' ? '+' : '-'}{transaction.amount}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Balance: {transaction.balanceAfter}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>{formatDate(transaction.createdAt)}</span>
                                            </div>
                                            <div className={cn(
                                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                                transaction.status === 'completed' && 'bg-green-100 text-green-700',
                                                transaction.status === 'pending' && 'bg-yellow-100 text-yellow-700',
                                                transaction.status === 'failed' && 'bg-red-100 text-red-700'
                                            )}>
                                                {transaction.status}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {total > limit && (
                    <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">{skip + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(skip + limit, total)}</span> of{' '}
                            <span className="font-medium">{total}</span> transactions
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setSkip(Math.max(0, skip - limit))}
                                disabled={skip === 0}
                                variant="outline"
                                size="sm"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <Button
                                onClick={() => setSkip(skip + limit)}
                                disabled={!hasMore}
                                variant="outline"
                                size="sm"
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
