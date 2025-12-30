'use client';

import { useState, useEffect } from 'react';
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
import { Client, CreateClientDto, UpdateClientDto } from '@/lib/api/clients';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client?: Client | null;
    onSave: (data: CreateClientDto | UpdateClientDto) => Promise<void>;
}

export function ClientDialog({ open, onOpenChange, client, onSave }: ClientDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<CreateClientDto>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
    });

    useEffect(() => {
        if (client) {
            setFormData({
                firstName: client.firstName,
                lastName: client.lastName,
                email: client.email,
                phone: client.phone || '',
                address: client.address || '',
                notes: client.notes || '',
            });
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                address: '',
                notes: '',
            });
        }
        setError(null);
    }, [client, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        setError(null);

        try {
            await onSave(formData);
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to save client:', error);
            setError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof CreateClientDto, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                    <DialogDescription>
                        {client
                            ? 'Update client information below.'
                            : 'Enter the client details to create a new profile.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="grid gap-4 py-4 overflow-y-auto px-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name *</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => handleChange('firstName', e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name *</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => handleChange('lastName', e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                rows={3}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="px-1 mb-4">
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {client ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
