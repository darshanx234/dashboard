'use client';

import { create } from 'zustand';

interface WalletState {
    balance: number | null;
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
    fetchBalance: () => Promise<void>;
    setBalance: (balance: number) => void;
    addCredits: (amount: number) => void;
    deductCredits: (amount: number) => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
    balance: null,
    loading: false,
    error: null,
    lastFetched: null,

    fetchBalance: async () => {
        // Prevent refetch within 30 seconds
        const { lastFetched, loading } = get();
        const now = Date.now();
        if (loading || (lastFetched && now - lastFetched < 30000)) {
            return;
        }

        set({ loading: true, error: null });

        try {
            const response = await fetch('/api/wallet');
            const data = await response.json();

            if (response.ok) {
                set({
                    balance: data.wallet.balance,
                    loading: false,
                    lastFetched: now,
                });
            } else {
                set({
                    error: data.error || 'Failed to fetch balance',
                    loading: false,
                });
            }
        } catch (err) {
            console.error('Error fetching balance:', err);
            set({
                error: 'Network error',
                loading: false,
            });
        }
    },

    setBalance: (balance: number) => {
        set({ balance, lastFetched: Date.now() });
    },

    addCredits: (amount: number) => {
        const { balance } = get();
        if (balance !== null) {
            set({ balance: balance + amount });
        }
    },

    deductCredits: (amount: number) => {
        const { balance } = get();
        if (balance !== null) {
            set({ balance: Math.max(0, balance - amount) });
        }
    },
}));
