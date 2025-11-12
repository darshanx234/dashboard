'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Calendar as CalendarIcon, MapPin, Lock } from 'lucide-react';
import { albumApi, type Album } from '@/lib/api/albums';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EditAlbumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  album: Album;
  onAlbumUpdated: (updatedAlbum: Album) => void;
}

export function EditAlbumDialog({ open, onOpenChange, album, onAlbumUpdated }: EditAlbumDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [shootDate, setShootDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<'draft' | 'processing' | 'published' | 'archived'>('draft');
  const [isPrivate, setIsPrivate] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [allowDownloads, setAllowDownloads] = useState(true);
  const [allowFavorites, setAllowFavorites] = useState(true);

  // Initialize form with album data
  useEffect(() => {
    if (album && open) {
      setTitle(album.title);
      setDescription(album.description || '');
      setLocation(album.location || '');
      setShootDate(album.shootDate ? new Date(album.shootDate) : undefined);
      setStatus(album.status);
      setIsPrivate(album.isPrivate);
      setHasPassword(!!album.password);
      setPassword('');
      setAllowDownloads(album.allowDownloads);
      setAllowFavorites(album.allowFavorites);
    }
  }, [album, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Album title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const updateData = {
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        shootDate: shootDate ? shootDate.toISOString() : undefined,
        status,
        isPrivate,
        password: hasPassword ? password : undefined,
        allowDownloads,
        allowFavorites,
      };

      const { album: updatedAlbum } = await albumApi.updateAlbum(album._id, updateData);

      toast({
        title: 'Success',
        description: 'Album updated successfully',
      });

      onAlbumUpdated(updatedAlbum);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Update album error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update album',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Album</DialogTitle>
          <DialogDescription>
            Update album information and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Album Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Sarah & John's Wedding"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add a description for this album..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., New York, NY"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Shoot Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !shootDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {shootDate ? format(shootDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={shootDate}
                      onSelect={setShootDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Private Album</Label>
                <p className="text-sm text-muted-foreground">
                  Only you can see this album
                </p>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>
                  <Lock className="h-4 w-4 inline mr-1" />
                  Password Protection
                </Label>
                <p className="text-sm text-muted-foreground">
                  Require password to view album
                </p>
              </div>
              <Switch checked={hasPassword} onCheckedChange={setHasPassword} />
            </div>

            {hasPassword && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="password">
                  Album Password {hasPassword && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={album.password ? "Enter new password to change" : "Enter password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {album.password && !password && (
                  <p className="text-xs text-muted-foreground">
                    Leave empty to keep current password
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Downloads</Label>
                <p className="text-sm text-muted-foreground">
                  Let viewers download photos
                </p>
              </div>
              <Switch checked={allowDownloads} onCheckedChange={setAllowDownloads} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Favorites</Label>
                <p className="text-sm text-muted-foreground">
                  Let viewers mark photos as favorites
                </p>
              </div>
              <Switch checked={allowFavorites} onCheckedChange={setAllowFavorites} />
            </div>
          </div>

          {/* Album Stats (Read-only) */}
          <div className="border-t pt-4">
            <Label className="text-sm text-muted-foreground">Album Statistics</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div className="text-center">
                <div className="text-2xl font-bold">{album.totalPhotos}</div>
                <div className="text-xs text-muted-foreground">Photos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{album.totalViews}</div>
                <div className="text-xs text-muted-foreground">Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{album.totalDownloads}</div>
                <div className="text-xs text-muted-foreground">Downloads</div>
              </div>
            </div>
          </div>

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
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
