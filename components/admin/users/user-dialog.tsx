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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { AdminUser, CreateUserDto, UpdateUserDto } from '@/lib/api/admin-users';

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: AdminUser | null;
    onSave: (data: CreateUserDto | UpdateUserDto) => Promise<void>;
}

export function UserDialog({ open, onOpenChange, user, onSave }: UserDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        email: '',
        password: '',
        fullName: '',
        businessName: '',
        userType: 'photographer' as 'photographer' | 'studio_owner',
        role: 'photographer' as 'photographer' | 'client' | 'admin',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const isEditing = !!user;

    // Reset form when dialog opens/closes or user changes
    useEffect(() => {
        if (open) {
            if (user) {
                setFormData({
                    phone: user.phone || '',
                    email: user.email || '',
                    password: '',
                    fullName: user.fullName || '',
                    businessName: user.businessName || '',
                    userType: user.userType || 'photographer',
                    role: user.role || 'photographer',
                });
            } else {
                setFormData({
                    phone: '',
                    email: '',
                    password: '',
                    fullName: '',
                    businessName: '',
                    userType: 'photographer',
                    role: 'photographer',
                });
            }
            setErrors({});
        }
    }, [open, user]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.phone) {
            newErrors.phone = 'Phone is required';
        } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
            newErrors.phone = 'Invalid phone format (10 digits starting with 6-9)';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!isEditing && formData.password && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);
        try {
            const data: CreateUserDto | UpdateUserDto = isEditing
                ? {
                    fullName: formData.fullName,
                    businessName: formData.businessName,
                    email: formData.email || undefined,
                    phone: formData.phone,
                    userType: formData.userType,
                    role: formData.role,
                }
                : {
                    phone: formData.phone,
                    email: formData.email || undefined,
                    password: formData.password || undefined,
                    fullName: formData.fullName,
                    businessName: formData.businessName,
                    userType: formData.userType,
                    role: formData.role,
                };

            await onSave(data);
            onOpenChange(false);
        } catch (error: any) {
            setErrors({ submit: error.message || 'Failed to save user' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update user information and permissions.'
                            : 'Create a new user account.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Phone */}
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                                id="phone"
                                placeholder="9876543210"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                            {errors.phone && (
                                <p className="text-sm text-red-500">{errors.phone}</p>
                            )}
                        </div>

                        {/* Full Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                placeholder="John Doe"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>

                        {/* Email */}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email}</p>
                            )}
                        </div>

                        {/* Password (only for new users) */}
                        {!isEditing && (
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-500">{errors.password}</p>
                                )}
                            </div>
                        )}

                        {/* Business Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="businessName">Business Name</Label>
                            <Input
                                id="businessName"
                                placeholder="Studio Name"
                                value={formData.businessName}
                                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                            />
                        </div>

                        {/* User Type */}
                        <div className="grid gap-2">
                            <Label>User Type *</Label>
                            <Select
                                value={formData.userType}
                                onValueChange={(value: 'photographer' | 'studio_owner') =>
                                    setFormData({ ...formData, userType: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="photographer">Photographer</SelectItem>
                                    <SelectItem value="studio_owner">Studio Owner</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Role */}
                        <div className="grid gap-2">
                            <Label>Role *</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value: 'photographer' | 'client' | 'admin') =>
                                    setFormData({ ...formData, role: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="photographer">Photographer</SelectItem>
                                    <SelectItem value="client">Client</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {errors.submit && (
                            <p className="text-sm text-red-500">{errors.submit}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Save Changes' : 'Create User'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
