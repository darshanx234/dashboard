'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TestAlbumPlansPage() {
    const { toast } = useToast();
    const [isInitializing, setIsInitializing] = useState(false);
    const [initResult, setInitResult] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(false);

    const initializePlans = async () => {
        try {
            setIsInitializing(true);
            setInitResult(null);

            const response = await fetch('/api/album-plans/init', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                setInitResult({ success: true, message: data.message, plans: data.plans });
                toast({
                    title: 'Success',
                    description: 'Album plans initialized successfully!',
                });
            } else {
                setInitResult({ success: false, error: data.error });
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to initialize plans',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            console.error('Error initializing plans:', error);
            setInitResult({ success: false, error: error.message });
            toast({
                title: 'Error',
                description: 'Failed to initialize plans',
                variant: 'destructive',
            });
        } finally {
            setIsInitializing(false);
        }
    };

    const loadPlans = async () => {
        try {
            setIsLoadingPlans(true);
            const response = await fetch('/api/album-plans');
            const data = await response.json();

            if (data.success) {
                setPlans(data.plans);
                toast({
                    title: 'Success',
                    description: `Loaded ${data.plans.length} plans`,
                });
            }
        } catch (error) {
            console.error('Error loading plans:', error);
            toast({
                title: 'Error',
                description: 'Failed to load plans',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingPlans(false);
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Album Plan System Test</h1>
                <p className="text-muted-foreground">
                    Test the album plan initialization and view available plans
                </p>
            </div>

            {/* Initialize Plans */}
            <Card>
                <CardHeader>
                    <CardTitle>Step 1: Initialize Default Plans</CardTitle>
                    <CardDescription>
                        Click the button below to create the 4 default album plans in the database
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={initializePlans} disabled={isInitializing}>
                        {isInitializing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Initialize Plans
                    </Button>

                    {initResult && (
                        <div className={`p-4 rounded-lg border ${initResult.success
                                ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                                : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                            }`}>
                            <div className="flex items-center gap-2 mb-2">
                                {initResult.success ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                )}
                                <span className="font-semibold">
                                    {initResult.success ? 'Success!' : 'Error'}
                                </span>
                            </div>
                            <p className="text-sm">
                                {initResult.success ? initResult.message : initResult.error}
                            </p>
                            {initResult.plans && (
                                <div className="mt-3 text-sm">
                                    <p className="font-medium mb-1">Created {initResult.plans.length} plans:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        {initResult.plans.map((plan: any) => (
                                            <li key={plan._id}>
                                                {plan.name} - ₹{plan.price} ({plan.storageLimitGB} GB)
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Load Plans */}
            <Card>
                <CardHeader>
                    <CardTitle>Step 2: View Available Plans</CardTitle>
                    <CardDescription>
                        Load and display all available album plans
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={loadPlans} disabled={isLoadingPlans} variant="outline">
                        {isLoadingPlans && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Load Plans
                    </Button>

                    {plans.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {plans.map((plan) => (
                                <Card key={plan._id} className="relative">
                                    {plan.isRecommended && (
                                        <div className="absolute -top-2 -right-2">
                                            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-2 py-1 rounded-full">
                                                Recommended
                                            </span>
                                        </div>
                                    )}
                                    <CardContent className="p-4">
                                        <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            {plan.description}
                                        </p>
                                        <div className="space-y-2">
                                            <div className="text-2xl font-bold">₹{plan.price}</div>
                                            <div className="text-sm">
                                                <span className="font-semibold">{plan.storageLimitGB} GB</span>
                                                <span className="text-muted-foreground"> storage</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {plan.durationDays} days validity
                                            </div>
                                            <div className="pt-2 border-t">
                                                <p className="text-xs font-medium mb-1">Features:</p>
                                                <ul className="text-xs space-y-1">
                                                    {plan.features.map((feature: string, idx: number) => (
                                                        <li key={idx} className="flex items-start gap-1">
                                                            <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                                            <span>{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
                <CardHeader>
                    <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p>✅ Plans initialized successfully</p>
                    <p>✅ Plans can be loaded via API</p>
                    <p className="pt-2">
                        <strong>To use in your app:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Import the CreateAlbumWithPlanForm component</li>
                        <li>Or integrate AlbumPlanSelector into your existing form</li>
                        <li>Use StorageIndicator to display album storage usage</li>
                    </ul>
                    <p className="pt-2 text-muted-foreground">
                        See ALBUM_PLAN_USAGE.md for detailed integration instructions
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
