'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlbumPlan {
    _id: string;
    name: string;
    description: string;
    price: number;
    storageLimitGB: number;
    durationDays: number;
    features: string[];
    isRecommended: boolean;
}

interface AlbumPlanSelectorProps {
    plans: AlbumPlan[];
    selectedPlanId?: string;
    onSelectPlan: (planId: string) => void;
    userBalance: number;
    disabled?: boolean;
}

export function AlbumPlanSelector({
    plans,
    selectedPlanId,
    onSelectPlan,
    userBalance,
    disabled = false,
}: AlbumPlanSelectorProps) {
    return (
        <div className="space-y-4">
            {/* <div>
                <h3 className="text-lg font-semibold mb-1">Select Album Plan</h3>
                <p className="text-sm text-muted-foreground">
                    Choose a plan based on your storage needs. Your wallet balance: ₹{userBalance}
                </p>
            </div> */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map((plan) => {
                    const isSelected = selectedPlanId === plan._id;
                    const canAfford = userBalance >= plan.price;
                    const isDisabled = disabled || !canAfford;

                    return (
                        <div
                            key={plan._id}
                            className={cn(
                                'rounded-xl p-4 border relative cursor-pointer transition-all hover:shadow-lg',
                                isSelected && 'ring-2 ring-primary',
                                isDisabled && 'opacity-50 cursor-not-allowed',
                                !isDisabled && 'hover:border-primary'
                            )}
                            onClick={() => !isDisabled && onSelectPlan(plan._id)}
                        >
                            {plan.isRecommended && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                                        <Zap className="h-3 w-3 mr-1" />
                                        Recommended
                                    </Badge>
                                </div>
                            )}

                            {/* <CardContent className="p-4 border"> */}
                            <div className="space-y-4">
                                {/* Plan Header */}
                                <div>
                                    <h4 className="text-xl font-bold">{plan.name}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {plan.description}
                                    </p>
                                </div>

                                {/* Price */}
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold">₹{plan.price}</span>
                                    {/* <span className="text-sm text-muted-foreground">/year</span> */}
                                </div>

                                {/* Storage */}
                                <div className="py-3 px-4 bg-muted rounded-lg">
                                    <div className="text-2xl font-bold text-center">
                                        {plan.storageLimitGB} GB
                                    </div>
                                    <div className="text-xs text-center text-muted-foreground">
                                        Storage Limit
                                    </div>
                                </div>

                                {/* Features */}
                                {/* <ul className="space-y-2">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm">
                                                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul> */}

                                {/* Insufficient Balance Warning */}
                                {!canAfford && (
                                    <div className="text-xs text-red-600 font-medium">
                                        Insufficient balance (Need ₹{plan.price - userBalance} more)
                                    </div>
                                )}

                                {/* Selected Indicator */}
                                {isSelected && (
                                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                                        <Check className="h-4 w-4" />
                                        Selected
                                    </div>
                                )}
                            </div>
                            {/* </CardContent> */}
                        </div>
                    );
                })}
            </div>

            {selectedPlanId && (
                <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Amount to be deducted:</span>
                        <span className="text-lg font-bold">
                            ₹{plans.find((p) => p._id === selectedPlanId)?.price || 0}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
