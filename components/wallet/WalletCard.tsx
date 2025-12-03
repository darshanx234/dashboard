'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, Plus, History, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCredits } from '@/lib/utils';

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
            <div className="animate-pulse space-y-4 border rounded-2xl p-6">
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
            </div>
        );
    }

    if (error || !wallet) {
        return (
            <div className="space-y-4 flex justify-between border rounded-2xl p-6">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Available Credits</p>
                    <div className="text-red-500">Error loading wallet</div>
                </div>
                <div>
                    <Button onClick={fetchWallet} variant="outline" size="icon">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="absolute rounded-2xl"></div>
            <div className="relative bg-white border rounded-2xl p-6">
                <div className="flex justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Available Credits</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold text-primary">
                                {formatCredits(wallet.balance)}
                            </span>
                            {/* <span className="text-xl font-semibold text-gray-500">{wallet.currency}</span> */}
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
    );
}
