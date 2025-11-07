'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { putWithAuth } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2, LogOut, Edit2, X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function ProfileForm() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
  });
  const [originalData, setOriginalData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      const data = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        bio: user.bio || '',
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditMode(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const data = await putWithAuth<{ user: any }>('/api/user/profile', formData);
      
      setOriginalData(formData);
      setSuccess(true);
      setIsEditMode(false);

      // Update Zustand store with new user data
      useAuthStore.setState({
        user: {
          ...user,
          ...data.user,
        },
      });

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Use Next.js router instead of window.location.href
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout');
    }
  };

  const initials = `${formData.firstName?.charAt(0) || 'U'}${formData.lastName?.charAt(0) || 'U'}`.toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.avatar} alt={`${formData.firstName} ${formData.lastName}`} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {formData.firstName && formData.lastName
                    ? `${formData.firstName} ${formData.lastName}`
                    : user?.email || 'User Profile'}
                </CardTitle>
                <CardDescription>{user?.email}</CardDescription>
                <p className="text-xs text-muted-foreground mt-1">
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                </p>
              </div>
            </div>
            {!isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(true)}
                className="ml-4"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Edit Profile Form / View Mode */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? 'Edit Profile' : 'Profile Information'}
          </CardTitle>
          <CardDescription>
            {isEditMode ? 'Update your personal information' : 'Your account details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Profile updated successfully!
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                {isEditMode ? (
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="px-3 py-2 rounded-md border border-input bg-background text-sm">
                    {formData.firstName || '—'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                {isEditMode ? (
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="px-3 py-2 rounded-md border border-input bg-background text-sm">
                    {formData.lastName || '—'}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              {isEditMode ? (
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
              ) : (
                <div className="px-3 py-2 rounded-md border border-input bg-background text-sm">
                  {formData.phone || '—'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              {isEditMode ? (
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={loading}
                  rows={4}
                />
              ) : (
                <div className="px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[100px] whitespace-pre-wrap">
                  {formData.bio || '—'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Read Only)</Label>
              <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                {user?.email}
              </div>
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support if you need to update your email.
              </p>
            </div>

            {isEditMode && (
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Logout Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Sign out of your account on this device.
          </p>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
