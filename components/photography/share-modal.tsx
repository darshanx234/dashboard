'use client';

import React, { useState } from 'react';
import { Share } from '@/types/photography';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, CheckCircle, QrCode, Calendar, Lock } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumId: string;
  share?: Share;
  onCreateShare?: (config: ShareConfig) => Promise<Share>;
  isLoading?: boolean;
}

interface ShareConfig {
  password?: string;
  allow_download: boolean;
  allow_favorites: boolean;
  expires_at?: string;
}

export function ShareModal({
  isOpen,
  onClose,
  albumId,
  share,
  onCreateShare,
  isLoading = false,
}: ShareModalProps) {
  const [config, setConfig] = useState<ShareConfig>({
    password: '',
    allow_download: true,
    allow_favorites: false,
    expires_at: '',
  });
  const [copied, setCopied] = useState(false);
  const [generatedShare, setGeneratedShare] = useState<Share | null>(share || null);

  const handleCreateShare = async () => {
    if (!onCreateShare) return;
    try {
      const newShare = await onCreateShare(config);
      setGeneratedShare(newShare);
    } catch (error) {
      console.error('Failed to create share', error);
    }
  };

  const shareUrl = generatedShare
    ? `${window.location.origin}/gallery/${generatedShare.share_token}`
    : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Album</DialogTitle>
          <DialogDescription>
            Configure sharing settings and generate a shareable link
          </DialogDescription>
        </DialogHeader>

        {!generatedShare ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Share Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="allow-download"
                      checked={config.allow_download}
                      onCheckedChange={(checked) =>
                        setConfig({ ...config, allow_download: !!checked })
                      }
                      disabled={isLoading}
                    />
                    <Label htmlFor="allow-download" className="font-normal cursor-pointer">
                      Allow clients to download photos
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="allow-favorites"
                      checked={config.allow_favorites}
                      onCheckedChange={(checked) =>
                        setConfig({ ...config, allow_favorites: !!checked })
                      }
                      disabled={isLoading}
                    />
                    <Label htmlFor="allow-favorites" className="font-normal cursor-pointer">
                      Allow clients to mark favorites
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Optional Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password Protection (Optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Leave blank for no password"
                    value={config.password || ''}
                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Clients will need to enter this password to view the album
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires">Link Expiration (Optional)</Label>
                  <Input
                    id="expires"
                    type="datetime-local"
                    value={config.expires_at || ''}
                    onChange={(e) => setConfig({ ...config, expires_at: e.target.value })}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank for permanent access
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={handleCreateShare} disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : 'Generate Share Link'}
              </Button>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Share link created successfully!
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shareable Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Share Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Downloads Allowed:</span>
                  <span className="font-medium">
                    {generatedShare.allow_download ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Favorites Allowed:</span>
                  <span className="font-medium">
                    {generatedShare.allow_favorites ? 'Yes' : 'No'}
                  </span>
                </div>
                {generatedShare.password_hash && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Lock className="h-4 w-4" />
                      Password Protected
                    </span>
                    <span className="font-medium">Yes</span>
                  </div>
                )}
                {generatedShare.expires_at && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Expires
                    </span>
                    <span className="font-medium">
                      {new Date(generatedShare.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
