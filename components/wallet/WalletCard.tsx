'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, Plus, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalletData {
    balance: number;
    currency: string;
    isActive: boolean;
}

interface WalletCardProps {
    className?: string;
    onAddCredits?: () => void;
    onViewTransactions?: () => void;
}

export function WalletCard({ className, onAddCredits, onViewTransactions }: WalletCardProps) {
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchWallet();
    }, []);

    const fetchWallet = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/wallet');
            const data = await response.json();

            if (response.ok) {
                setWallet(data.wallet);
            } else {
                setError(data.error || 'Failed to fetch wallet');
            }
        } catch (err) {
            setError('Failed to fetch wallet');
            console.error('Error fetching wallet:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className={cn('overflow-hidden', className)}>
                <CardHeader className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Wallet className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold">Wallet</CardTitle>
                                <CardDescription className="text-purple-100">Loading...</CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-12 bg-gray-200 rounded"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || !wallet) {
        return (
            <Card className={cn('overflow-hidden border-red-200', className)}>
                <CardHeader className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold">Wallet</CardTitle>
                            <CardDescription className="text-red-100">Error loading wallet</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={fetchWallet} variant="outline" className="w-full">
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300', className)}>
            <CardContent className="p-6 space-y-6">
                {/* Balance Display */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl blur-sm"></div>
                    <div className="relative bg-white border-2 border-purple-200 rounded-2xl p-6">
                        <div className="flex items-baseline justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Available Credits</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                        {wallet.balance.toLocaleString()}
                                    </span>
                                    <span className="text-xl font-semibold text-gray-500">{wallet.currency}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {wallet.balance > 100 ? (
                                    <div className="flex items-center gap-1 text-green-600">
                                        <TrendingUp className="h-5 w-5" />
                                        <span className="text-sm font-semibold">Good</span>
                                    </div>
                                ) : wallet.balance > 50 ? (
                                    <div className="flex items-center gap-1 text-yellow-600">
                                        <TrendingDown className="h-5 w-5" />
                                        <span className="text-sm font-semibold">Low</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 text-red-600">
                                        <TrendingDown className="h-5 w-5" />
                                        <span className="text-sm font-semibold">Critical</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <Button
                        onClick={onAddCredits}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Credits
                    </Button>
                    <Button
                        onClick={onViewTransactions}
                        variant="outline"
                        className="border-2 border-purple-300 hover:bg-purple-50 font-semibold transition-all duration-300"
                    >
                        <History className="h-4 w-4 mr-2" />
                        History
                    </Button>
                </div>

                {/* Info Banner */}
                {wallet.balance < 50 && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-yellow-800">
                                    Low credit balance
                                </p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Add more credits to continue creating albums. Each album costs 10 credits.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
