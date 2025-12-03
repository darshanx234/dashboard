'use client';

import { useState } from 'react';
import { WalletCard } from '@/components/wallet/WalletCard';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';
import { AddCreditsDialog } from '@/components/wallet/AddCreditsDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Link, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';

export default function WalletPage() {
    const router = useRouter();
    const [showAddCredits, setShowAddCredits] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleAddCreditsSuccess = () => {
        // Refresh both components by changing the key
        setRefreshKey(prev => prev + 1);
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header with Actions */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Wallet</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your credits and view transaction history
                        </p>
                    </div>
                    <Button onClick={() => setShowAddCredits(true)}>
                        <Plus className="mr-2 h-5 w-5" />
                        Add Credits
                    </Button>
                    {/* <Button size="lg" asChild>
                        <Link href="/albums/create">
                            <Plus className="mr-2 h-5 w-5" />
                            Add Credits
                        </Link>
                    </Button> */}
                </div>
                {/* Main Content */}
                <div className="">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Wallet Card - Left Column */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24">
                                <WalletCard
                                    key={`wallet-${refreshKey}`}
                                    onAddCredits={() => setShowAddCredits(true)}
                                    onViewTransactions={() => {
                                        // Scroll to transaction history
                                        const element = document.getElementById('transaction-history');
                                        if (element) {
                                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                    }}
                                />

                                {/* Info Cards */}
                                <div className="mt-4 space-y-4">
                                    <div className="bg-white rounded-xl p-4 border">
                                        <h3 className="font-semibold text-gray-900 mb-2">💡 How it works</h3>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            <li>• Get 300 credits on signup</li>
                                            <li>• Each album costs 10 credits</li>
                                            <li>• Add credits anytime</li>
                                            <li>• Track all transactions</li>
                                        </ul>
                                    </div>

                                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-4 text-white">
                                        <h3 className="font-semibold mb-2">🎁 Need more credits?</h3>
                                        <p className="text-sm text-purple-100 mb-3">
                                            Add credits to continue creating amazing albums for your clients
                                        </p>
                                        <Button
                                            onClick={() => setShowAddCredits(true)}
                                            className="w-full bg-white text-purple-600 hover:bg-purple-50 font-semibold"
                                        >
                                            Add Credits Now
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transaction History - Right Column */}
                        <div className="lg:col-span-2" id="transaction-history">
                            <TransactionHistory key={`transactions-${refreshKey}`} />
                        </div>
                    </div>
                </div>
            </div>
            {/* Add Credits Dialog */}
            <AddCreditsDialog
                open={showAddCredits}
                onOpenChange={setShowAddCredits}
                onSuccess={handleAddCreditsSuccess}
            />
        </AppLayout>
    );
}
