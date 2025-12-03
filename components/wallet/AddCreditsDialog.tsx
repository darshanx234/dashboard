'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddCreditsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];

export function AddCreditsDialog({ open, onOpenChange, onSuccess }: AddCreditsDialogProps) {
    const [amount, setAmount] = useState<number>(100);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (amount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (!description.trim()) {
            setError('Please enter a description');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/wallet/add-credits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount,
                    description: description.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Reset form
                setAmount(100);
                setDescription('');
                onOpenChange(false);

                // Call success callback
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                setError(data.error || 'Failed to add credits');
            }
        } catch (err) {
            setError('Failed to add credits. Please try again.');
            console.error('Error adding credits:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePresetClick = (presetAmount: number) => {
        setAmount(presetAmount);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] h-screen">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
                            <Coins className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold">Add Credits</DialogTitle>
                            <DialogDescription>
                                Add credits to your wallet to create more albums
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Preset Amounts */}
                    <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                            Quick Select
                        </Label>
                        <div className="grid grid-cols-5 gap-2">
                            {PRESET_AMOUNTS.map((preset) => (
                                <Button
                                    key={preset}
                                    type="button"
                                    variant={amount === preset ? 'default' : 'outline'}
                                    onClick={() => handlePresetClick(preset)}
                                    className={cn(
                                        'font-semibold transition-all duration-200',
                                        amount === preset && 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                                    )}
                                >
                                    {preset}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Amount */}
                    <div>
                        <Label htmlFor="amount" className="text-sm font-semibold text-gray-700">
                            Amount <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative mt-2">
                            <Input
                                id="amount"
                                type="number"
                                min="1"
                                step="1"
                                value={amount}
                                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                                className="pl-10 text-lg font-semibold"
                                placeholder="Enter amount"
                                required
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                <Coins className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Each album creation costs 10 credits
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                            Description <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-2 resize-none"
                            placeholder="e.g., Credits for upcoming wedding shoots"
                            rows={3}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Add a note about this transaction
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border-2 border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Credits to add:</span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                {amount.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>Albums you can create:</span>
                            <span className="font-semibold">~{Math.floor(amount / 10)}</span>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || amount <= 0 || !description.trim()}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold min-w-[120px]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Credits
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
