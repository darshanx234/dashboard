'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, User } from 'lucide-react';

interface ClientIdentityDialogProps {
    open: boolean;
    onSubmit: (name: string, email?: string) => Promise<void>;
    isSubmitting: boolean;
}

export function ClientIdentityDialog({
    open,
    onSubmit,
    isSubmitting,
}: ClientIdentityDialogProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Please enter your name');
            return;
        }

        try {
            await onSubmit(name.trim(), email.trim() || undefined);
        } catch (err: any) {
            setError(err.message || 'Failed to save your information');
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="flex justify-center mb-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                            <User className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-2xl">Welcome!</DialogTitle>
                    <DialogDescription className="text-center">
                        Please introduce yourself before viewing this album
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isSubmitting}
                            autoFocus
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email (optional)</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Continue to Album'
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
