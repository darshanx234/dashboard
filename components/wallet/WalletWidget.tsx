'use client';

import { useState, useEffect } from 'react';
import { Wallet, Plus, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface WalletWidgetProps {
    className?: string;
    showAddButton?: boolean;
}

export function WalletWidget({ className, showAddButton = true }: WalletWidgetProps) {
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBalance();
    }, []);

    const fetchBalance = async () => {
        try {
            const response = await fetch('/api/wallet');
            const data = await response.json();

            if (response.ok) {
                setBalance(data.wallet.balance);
            }
        } catch (err) {
            console.error('Error fetching balance:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={cn('flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg animate-pulse', className)}>
                <Wallet className="h-4 w-4 text-gray-400" />
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>
        );
    }

    if (balance === null) {
        return null;
    }

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <Link href="/wallet">
                <div className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 cursor-pointer',
                    'border-primary bg-primary/10 border-1 hover:border-primary',
                    balance < 50 && 'from-red-100 to-orange-100 border-red-200 hover:from-red-200 hover:to-orange-200 hover:border-red-300'
                )}>
                    {/* <Coins className={cn(
                        'h-6 w-6',
                        balance < 50 ? 'text-red-600' : 'text-primary'
                    )} /> */}
                    <div className="flex flex-col">
                        <span className={cn(
                            'text-lg font-bold leading-none',
                            balance < 50 ? 'text-red-600' : 'text-primary'
                        )}>
                            {formatCurrency(balance, { showSymbol: true })}
                        </span>
                    </div>
                </div>
            </Link>
        </div>
    );
}
