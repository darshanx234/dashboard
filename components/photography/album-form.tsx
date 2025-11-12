'use client';

import React, { useState } from 'react';
import { Album, PrivacySetting } from '@/types/photography';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface AlbumFormProps {
  album?: Album;
  onSubmit: (data: Partial<Album>) => Promise<void>;
  isLoading?: boolean;
}

export function AlbumForm({ album, onSubmit, isLoading = false }: AlbumFormProps) {
  const [formData, setFormData] = useState<Partial<Album>>({
    title: album?.title || '',
    description: album?.description || '',
    date_taken: album?.date_taken || '',
    location: album?.location || '',
    privacy_setting: album?.privacy_setting || 'private',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{album ? 'Edit Album' : 'Create New Album'}</CardTitle>
        <CardDescription>
          {album ? 'Update album details and settings' : 'Add metadata for your new album'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Album Title</Label>
            <Input
              id="title"
              placeholder="e.g., Summer Wedding 2024"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add a brief description of this album..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Photo Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date_taken || ''}
                onChange={(e) => setFormData({ ...formData, date_taken: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Destination venue"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="privacy">Privacy Setting</Label>
            <Select
              value={formData.privacy_setting || 'private'}
              onValueChange={(value) =>
                setFormData({ ...formData, privacy_setting: value as PrivacySetting })
              }
              disabled={isLoading}
            >
              <SelectTrigger id="privacy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private (Only me)</SelectItem>
                <SelectItem value="password_protected">Password Protected</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {album ? 'Update Album' : 'Create Album'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
