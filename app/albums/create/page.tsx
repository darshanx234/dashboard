'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { albumApi } from '@/lib/api/albums';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function CreateAlbumPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shootDate, setShootDate] = useState<Date>();
  const [location, setLocation] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [allowDownloads, setAllowDownloads] = useState(true);
  const [allowFavorites, setAllowFavorites] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Album title is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { album } = await albumApi.createAlbum({
        title: title.trim(),
        description: description.trim() || undefined,
        shootDate: shootDate ? format(shootDate, 'yyyy-MM-dd') : undefined,
        location: location.trim() || undefined,
        isPrivate,
        password: hasPassword && password ? password : undefined,
        allowDownloads,
        allowFavorites,
      });

      toast({
        title: 'Success',
        description: 'Album created successfully',
      });

      // Redirect to the album page to upload photos
      router.push(`/albums/${album._id}`);
    } catch (error: any) {
      console.error('Create album error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create album',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  return (      
    <AppLayout>
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/albums" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Albums
          </Link>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Create New Album</h1>
          <p className="text-muted-foreground mt-2">
            Fill in the details below to create a new photo album
          </p>
        </div>

        {/* Album Metadata Form */}
        <Card>
          <CardHeader>
            <CardTitle>Album Information</CardTitle>
            <CardDescription>
              Basic details about your album
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Album Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Album Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Wedding - Sarah & John"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Give your album a descriptive name
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add details about this album..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Provide context or notes about this album
              </p>
            </div>

            {/* Date and Location Row */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Event Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Event Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {shootDate ? format(shootDate, 'PPP') : <span className="text-muted-foreground">Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar 
                      mode="single" 
                      selected={shootDate}
                      onSelect={setShootDate}
                      disabled={loading}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="e.g., Central Park, NY"
                    className="pl-9"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy & Sharing</CardTitle>
            <CardDescription>
              Control who can view this album
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Private/Public Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Private Album</Label>
                <p className="text-sm text-muted-foreground">
                  Only accessible via shared link
                </p>
              </div>
              <Switch 
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
                disabled={loading}
              />
            </div>

            {/* Password Protection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Password Protection</Label>
                  <p className="text-sm text-muted-foreground">
                    Require password to access
                  </p>
                </div>
                <Switch 
                  checked={hasPassword}
                  onCheckedChange={setHasPassword}
                  disabled={loading}
                />
              </div>
              {hasPassword && (
                <Input
                  type="password"
                  placeholder="Enter album password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              )}
            </div>

            {/* Download Permission */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Downloads</Label>
                <p className="text-sm text-muted-foreground">
                  Let viewers download photos
                </p>
              </div>
              <Switch 
                checked={allowDownloads}
                onCheckedChange={setAllowDownloads}
                disabled={loading}
              />
            </div>

            {/* Favorites Feature */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Favorites</Label>
                <p className="text-sm text-muted-foreground">
                  Allow clients to mark favorite photos
                </p>
              </div>
              <Switch 
                checked={allowFavorites}
                onCheckedChange={setAllowFavorites}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button type="submit" size="lg" className="flex-1" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Creating...' : 'Create Album & Upload Photos'}
          </Button>
          <Button type="button" size="lg" variant="outline" asChild disabled={loading}>
            <Link href="/albums">Cancel</Link>
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
