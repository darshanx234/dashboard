'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Link2,
  Copy,
  Check,
  Trash2,
  Eye,
  Download,
  Heart,
  Calendar,
  Lock,
  Loader2,
  QrCode,
  Globe,
  CheckSquare,
  Pencil,
  MessageSquare
} from 'lucide-react';
import { shareApi, type AlbumShare, type SharePermissions } from '@/lib/api/albums';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import QRCodeLib from 'qrcode';

interface ShareContentProps {
  albumId: string;
  albumTitle: string;
  initialShowQR?: boolean;
}

export function ShareContent({ albumId, albumTitle, initialShowQR = false }: ShareContentProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('public');
  const [loading, setLoading] = useState(false);

  // Link States
  const [publicLink, setPublicLink] = useState<AlbumShare | null>(null);
  const [privateLink, setPrivateLink] = useState<AlbumShare | null>(null);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);

  // Public Edit Mode
  const [isEditingPublic, setIsEditingPublic] = useState(false);

  // QR Code State
  const [showQRCode, setShowQRCode] = useState(initialShowQR);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Public settings form
  const [publicExpiry, setPublicExpiry] = useState('');
  const [publicPermissions, setPublicPermissions] = useState<SharePermissions>({
    canView: true,
    canDownload: true,
    canFavorite: true,
    canComment: false,
    canSelect: false,
  });

  // Private settings form
  const [privatePassword, setPrivatePassword] = useState('');
  const [privateExpiry, setPrivateExpiry] = useState('');

  useEffect(() => {
    fetchShares();
  }, [albumId]);

  useEffect(() => {
    if (publicLink?.shareUrl && showQRCode) {
      generateQRCode(publicLink.shareUrl);
    }
  }, [publicLink?.shareUrl, showQRCode]);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const response = await shareApi.getShares(albumId);
      setPublicLink(response.publicLink);
      setPrivateLink(response.privateLink);

      // Pre-fill public share settings if exists
      if (response.publicLink) {
        setPublicPermissions(response.publicLink.permissions);
        setPublicExpiry(response.publicLink.expiresAt || '');
      }
    } catch (error: any) {
      console.error('Failed to fetch shares:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load shares',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createPublicLink = async () => {
    try {
      setLoading(true);
      const response = await shareApi.createShare(albumId, {
        linkType: 'public',
        expiresAt: publicExpiry || undefined,
      });

      setPublicLink(response.shares[0]);
      toast({
        title: 'Success',
        description: 'Public link created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create public link',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createPrivateLink = async () => {
    if (!privatePassword) {
      toast({
        title: 'Password Required',
        description: 'Please enter a password for the private link',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await shareApi.createShare(albumId, {
        linkType: 'private',
        password: privatePassword,
        expiresAt: privateExpiry || undefined,
      });

      setPrivateLink(response.shares[0]);
      setPrivatePassword('');
      toast({
        title: 'Success',
        description: 'Private link created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create private link',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePublicShare = async () => {
    if (!publicLink) return;

    try {
      setLoading(true);
      const response = await shareApi.updateShare(albumId, {
        shareId: publicLink._id,
        permissions: {
          ...publicPermissions,
          canSelect: false, // Ensure canSelect is false for public links
        },
      });

      setPublicLink({
        ...publicLink,
        permissions: response.share.permissions
      });

      setIsEditingPublic(false);
      toast({
        title: 'Success',
        description: 'Link permissions updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update permissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const revokeShare = async (shareId: string, isPublic: boolean) => {
    try {
      await shareApi.revokeShare(albumId, shareId);

      if (isPublic) {
        setPublicLink(null);
      } else {
        setPrivateLink(null);
      }

      toast({
        title: 'Success',
        description: 'Share revoked successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke share',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string, isPublic: boolean) => {
    navigator.clipboard.writeText(text);
    if (isPublic) {
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2000);
    } else {
      setCopiedPrivate(true);
      setTimeout(() => setCopiedPrivate(false), 2000);
    }
    toast({
      title: 'Copied',
      description: 'Share link copied to clipboard',
    });
  };

  const generateQRCode = async (url: string) => {
    try {
      const dataUrl = await QRCodeLib.toDataURL(url, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate QR code',
        variant: 'destructive',
      });
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `${albumTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr_code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Downloaded',
      description: 'QR code downloaded successfully',
    });
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="public" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Public Link
          </TabsTrigger>
          <TabsTrigger value="private" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Private Link
          </TabsTrigger>
        </TabsList>

        {/* PUBLIC LINK TAB */}
        <TabsContent value="public" className="space-y-4 mt-4">
          {publicLink ? (
            <Card>
              <CardContent className="pt-6 space-y-4">
                {!isEditingPublic ? (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">Share Link</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            value={publicLink.shareUrl || ''}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(publicLink.shareUrl || '', true)}
                          >
                            {copiedPublic ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {publicLink.views} views
                      </div>
                      {publicLink.expiresAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Expires {format(new Date(publicLink.expiresAt), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {publicLink.permissions.canView && (
                        <Badge variant="secondary">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Badge>
                      )}
                      {publicLink.permissions.canDownload && (
                        <Badge variant="secondary">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Badge>
                      )}
                      {publicLink.permissions.canFavorite && (
                        <Badge variant="secondary">
                          <Heart className="h-3 w-3 mr-1" />
                          Favorite
                        </Badge>
                      )}
                      {publicLink.permissions.canComment && (
                        <Badge variant="secondary">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Comment
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-muted-foreground">
                        <CheckSquare className="h-3 w-3 mr-1" />
                        No Selection
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditingPublic(true);
                          setPublicPermissions({
                            canView: publicLink.permissions.canView,
                            canDownload: publicLink.permissions.canDownload,
                            canFavorite: publicLink.permissions.canFavorite,
                            canComment: publicLink.permissions.canComment || false,
                            canSelect: false
                          });
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Permissions
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => revokeShare(publicLink._id, true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Revoke Link
                      </Button>
                    </div>

                    <Separator />

                    {/* QR Code Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">QR Code</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowQRCode(!showQRCode)}
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
                        </Button>
                      </div>

                      {showQRCode && (
                        <div className="flex flex-col items-center gap-3 p-4 bg-muted rounded-lg">
                          {qrCodeDataUrl ? (
                            <>
                              <div className="bg-white p-3 rounded-lg">
                                <img
                                  src={qrCodeDataUrl}
                                  alt="QR Code"
                                  className="w-40 h-40"
                                />
                              </div>
                              <p className="text-xs text-center text-muted-foreground max-w-xs">
                                Scan this QR code to access the album directly
                              </p>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={downloadQRCode}
                                className="w-full max-w-xs"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download QR Code
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Edit Public Link Permissions</h3>
                    </div>

                    <div className="space-y-2">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Allow viewing photos</span>
                          </div>
                          <Switch
                            checked={publicPermissions.canView}
                            onCheckedChange={(checked) =>
                              setPublicPermissions({ ...publicPermissions, canView: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Download className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Allow downloading photos</span>
                          </div>
                          <Switch
                            checked={publicPermissions.canDownload}
                            onCheckedChange={(checked) =>
                              setPublicPermissions({ ...publicPermissions, canDownload: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Allow favoriting photos</span>
                          </div>
                          <Switch
                            checked={publicPermissions.canFavorite}
                            onCheckedChange={(checked) =>
                              setPublicPermissions({ ...publicPermissions, canFavorite: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingPublic(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={updatePublicShare}
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
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Allow viewing photos</span>
                      </div>
                      <Switch
                        checked={publicPermissions.canView}
                        onCheckedChange={(checked) =>
                          setPublicPermissions({ ...publicPermissions, canView: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Allow downloading photos</span>
                      </div>
                      <Switch
                        checked={publicPermissions.canDownload}
                        onCheckedChange={(checked) =>
                          setPublicPermissions({ ...publicPermissions, canDownload: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Allow favoriting photos</span>
                      </div>
                      <Switch
                        checked={publicPermissions.canFavorite}
                        onCheckedChange={(checked) =>
                          setPublicPermissions({ ...publicPermissions, canFavorite: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="public-expiry">Expiration Date (Optional)</Label>
                  <Input
                    id="public-expiry"
                    type="datetime-local"
                    value={publicExpiry}
                    onChange={(e) => setPublicExpiry(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={createPublicLink} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Create Public Link
                  </>
                )}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* PRIVATE LINK TAB */}
        <TabsContent value="private" className="space-y-4 mt-4">
          {privateLink ? (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Share Link</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={privateLink.shareUrl || ''}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(privateLink.shareUrl || '', false)}
                      >
                        {copiedPrivate ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {privateLink.views} views
                  </div>
                  {privateLink.expiresAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Expires {format(new Date(privateLink.expiresAt), 'MMM d, yyyy')}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Lock className="h-4 w-4" />
                    Password protected
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {privateLink.permissions.canView && (
                    <Badge variant="secondary">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Badge>
                  )}
                  {privateLink.permissions.canDownload && (
                    <Badge variant="secondary">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Badge>
                  )}
                  {privateLink.permissions.canFavorite && (
                    <Badge variant="secondary">
                      <Heart className="h-3 w-3 mr-1" />
                      Favorite
                    </Badge>
                  )}
                  {privateLink.permissions.canSelect && (
                    <Badge variant="default">
                      <CheckSquare className="h-3 w-3 mr-1" />
                      Photo Selection
                    </Badge>
                  )}
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => revokeShare(privateLink._id, false)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Revoke Link
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create a password-protected private link. Users can view, download, favorite,
                and select their favorite photos for the final album.
              </p>

              <div className="space-y-2">
                <Label htmlFor="private-password">Password (Required)</Label>
                <Input
                  id="private-password"
                  type="password"
                  placeholder="Enter a password"
                  value={privatePassword}
                  onChange={(e) => setPrivatePassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="private-expiry">Expiration Date (Optional)</Label>
                <Input
                  id="private-expiry"
                  type="datetime-local"
                  value={privateExpiry}
                  onChange={(e) => setPrivateExpiry(e.target.value)}
                />
              </div>

              <div className="p-3 rounded-md bg-muted/50">
                <p className="text-sm font-medium mb-2">Included Permissions:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Badge>
                  <Badge variant="secondary">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Badge>
                  <Badge variant="secondary">
                    <Heart className="h-3 w-3 mr-1" />
                    Favorite
                  </Badge>
                  <Badge variant="default">
                    <CheckSquare className="h-3 w-3 mr-1" />
                    Photo Selection
                  </Badge>
                </div>
              </div>

              <Button onClick={createPrivateLink} disabled={loading || !privatePassword} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Create Private Link
                  </>
                )}
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
