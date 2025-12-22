'use client';

import React, { useState, useEffect } from 'react';
import { AlbumPlanSelector, AlbumPlan } from './album-plan-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateAlbumWithPlanFormProps {
    onSuccess?: (album: any) => void;
}

export function CreateAlbumWithPlanForm({ onSuccess }: CreateAlbumWithPlanFormProps) {
    const { toast } = useToast();
    const [plans, setPlans] = useState<AlbumPlan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [userBalance, setUserBalance] = useState<number>(0);
    const [isLoadingPlans, setIsLoadingPlans] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        shootDate: '',
    });

    // Fetch plans and wallet balance on mount
    useEffect(() => {
        fetchPlansAndBalance();
    }, []);

    const fetchPlansAndBalance = async () => {
        try {
            setIsLoadingPlans(true);

            // Fetch plans
            const plansRes = await fetch('/api/album-plans');
            const plansData = await plansRes.json();

            if (plansData.success) {
                setPlans(plansData.plans);
                // Auto-select recommended plan
                const recommended = plansData.plans.find((p: AlbumPlan) => p.isRecommended);
                if (recommended) {
                    setSelectedPlanId(recommended._id);
                }
            }

            // Fetch wallet balance
            const walletRes = await fetch('/api/wallet');
            const walletData = await walletRes.json();

            if (walletData.success) {
                setUserBalance(walletData.wallet.balance);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast({
                title: 'Error',
                description: 'Failed to load album plans',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingPlans(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPlanId) {
            toast({
                title: 'Plan Required',
                description: 'Please select an album plan',
                variant: 'destructive',
            });
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await fetch('/api/albums', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    planId: selectedPlanId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create album');
            }

            toast({
                title: 'Success',
                description: 'Album created successfully!',
            });

            // Reset form
            setFormData({
                title: '',
                description: '',
                location: '',
                shootDate: '',
            });

            if (onSuccess) {
                onSuccess(data.album);
            }
        } catch (error: any) {
            console.error('Error creating album:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create album',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingPlans) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Plan Selection */}
            <AlbumPlanSelector
                plans={plans}
                selectedPlanId={selectedPlanId}
                onSelectPlan={setSelectedPlanId}
                userBalance={userBalance}
                disabled={isSubmitting}
            />

            {/* Album Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Album Details</CardTitle>
                    <CardDescription>
                        Provide information about your album
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Album Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Summer Wedding 2024"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Add a brief description of this album..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            disabled={isSubmitting}
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="shootDate">Shoot Date</Label>
                            <Input
                                id="shootDate"
                                type="date"
                                value={formData.shootDate}
                                onChange={(e) => setFormData({ ...formData, shootDate: e.target.value })}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                placeholder="e.g., Destination venue"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting || !selectedPlanId} size="lg">
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Album
                </Button>
            </div>
        </form>
    );
}
