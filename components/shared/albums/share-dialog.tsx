'use client';

import { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Link2,
  Mail,
  Copy,
  Check,
  Trash2,
  Edit,
  Eye,
  Download,
  Heart,
  MessageSquare,
  Calendar,
  Lock,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { shareApi, type AlbumShare, type SharePermissions } from '@/lib/api/albums';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  albumId: string;
  albumTitle: string;
}

export function ShareDialog({ open, onOpenChange, albumId, albumTitle }: ShareDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('link');
  const [loading, setLoading] = useState(false);
  const [shares, setShares] = useState<AlbumShare[]>([]);
  const [publicShare, setPublicShare] = useState<AlbumShare | null>(null);
  const [privateShares, setPrivateShares] = useState<AlbumShare[]>([]);
  const [copied, setCopied] = useState(false);

  // Public link settings
  const [publicPassword, setPublicPassword] = useState('');
  const [publicExpiry, setPublicExpiry] = useState('');
  const [publicPermissions, setPublicPermissions] = useState<SharePermissions>({
    canView: true,
    canDownload: true,
    canFavorite: true,
    canComment: false,
  });

  // Email sharing settings
  const [emailList, setEmailList] = useState<Array<{ email: string; name: string }>>([
    { email: '', name: '' },
  ]);
  const [emailPermissions, setEmailPermissions] = useState<SharePermissions>({
    canView: true,
    canDownload: true,
    canFavorite: true,
    canComment: false,
  });
  const [emailExpiry, setEmailExpiry] = useState('');

  useEffect(() => {
    if (open) {
      fetchShares();
    }
  }, [open, albumId]);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const response = await shareApi.getShares(albumId);
      setShares(response.shares);
      setPublicShare(response.publicShare || null);
      setPrivateShares(response.privateShares);

      // Pre-fill public share settings if exists
      if (response.publicShare) {
        setPublicPermissions(response.publicShare.permissions);
        setPublicExpiry(response.publicShare.expiresAt || '');
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

  const createPublicShare = async () => {
    try {
      setLoading(true);
      const response = await shareApi.createShare(albumId, {
        shareType: 'link',
        permissions: publicPermissions,
        password: publicPassword || undefined,
        expiresAt: publicExpiry || undefined,
      });

      setPublicShare(response.shares[0]);
      toast({
        title: 'Success',
        description: 'Public share link created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create share link',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createEmailShares = async () => {
    // Validate emails
    const validEmails = emailList.filter(item => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return item.email && emailRegex.test(item.email);
    });

    if (validEmails.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter at least one valid email address',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await shareApi.createShare(albumId, {
        shareType: 'email',
        emails: validEmails,
        permissions: emailPermissions,
        expiresAt: emailExpiry || undefined,
      });

      setPrivateShares([...privateShares, ...response.shares]);
      setEmailList([{ email: '', name: '' }]); // Reset form
      
      toast({
        title: 'Success',
        description: `Album shared with ${response.shares.length} user(s)`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to share album',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied',
      description: 'Share link copied to clipboard',
    });
  };

  const revokeShare = async (shareId: string) => {
    try {
      await shareApi.revokeShare(albumId, shareId);
      
      // Update state
      if (publicShare?._id === shareId) {
        setPublicShare(null);
      }
      setPrivateShares(privateShares.filter(s => s._id !== shareId));
      
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

  const addEmailField = () => {
    setEmailList([...emailList, { email: '', name: '' }]);
  };

  const removeEmailField = (index: number) => {
    setEmailList(emailList.filter((_, i) => i !== index));
  };

  const updateEmailField = (index: number, field: 'email' | 'name', value: string) => {
    const updated = [...emailList];
    updated[index][field] = value;
    setEmailList(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Album</DialogTitle>
          <DialogDescription>
            Share "{albumTitle}" with others via public link or private email invitations
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Public Link
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Private Share
            </TabsTrigger>
          </TabsList>

          {/* PUBLIC LINK TAB */}
          <TabsContent value="link" className="space-y-4 mt-4">
            {publicShare ? (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">Share Link</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          value={publicShare.shareUrl || ''}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(publicShare.shareUrl || '')}
                        >
                          {copied ? (
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
                      {publicShare.views} views
                    </div>
                    {publicShare.expiresAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Expires {format(new Date(publicShare.expiresAt), 'MMM d, yyyy')}
                      </div>
                    )}
                    {publicShare.password && (
                      <div className="flex items-center gap-1">
                        <Lock className="h-4 w-4" />
                        Password protected
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {publicShare.permissions.canView && (
                      <Badge variant="secondary">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Badge>
                    )}
                    {publicShare.permissions.canDownload && (
                      <Badge variant="secondary">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Badge>
                    )}
                    {publicShare.permissions.canFavorite && (
                      <Badge variant="secondary">
                        <Heart className="h-3 w-3 mr-1" />
                        Favorite
                      </Badge>
                    )}
                    {publicShare.permissions.canComment && (
                      <Badge variant="secondary">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Comment
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => revokeShare(publicShare._id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Revoke Link
                  </Button>
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Allow commenting</span>
                        </div>
                        <Switch
                          checked={publicPermissions.canComment}
                          onCheckedChange={(checked) =>
                            setPublicPermissions({ ...publicPermissions, canComment: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="public-password">Password Protection (Optional)</Label>
                    <Input
                      id="public-password"
                      type="password"
                      placeholder="Leave empty for no password"
                      value={publicPassword}
                      onChange={(e) => setPublicPassword(e.target.value)}
                    />
                  </div>

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

                <Button onClick={createPublicShare} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Link2 className="mr-2 h-4 w-4" />
                      Create Public Link
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* EMAIL SHARE TAB */}
          <TabsContent value="email" className="space-y-4 mt-4">
            {/* Existing Private Shares */}
            {privateShares.length > 0 && (
              <div className="space-y-2">
                <Label>Shared With</Label>
                <div className="space-y-2">
                  {privateShares.map((share) => (
                    <Card key={share._id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{share.sharedWith.name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">
                              {share.sharedWith.email}
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Eye className="h-3 w-3" />
                              {share.views} views
                              {share.expiresAt && (
                                <>
                                  <span>•</span>
                                  <Calendar className="h-3 w-3" />
                                  Expires {format(new Date(share.expiresAt), 'MMM d, yyyy')}
                                </>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => revokeShare(share._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Separator className="my-4" />
              </div>
            )}

            {/* New Email Share Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Invite People</Label>
                <div className="space-y-2">
                  {emailList.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Email address"
                        type="email"
                        value={item.email}
                        onChange={(e) => updateEmailField(index, 'email', e.target.value)}
                      />
                      <Input
                        placeholder="Name (optional)"
                        value={item.name}
                        onChange={(e) => updateEmailField(index, 'name', e.target.value)}
                      />
                      {emailList.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmailField(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addEmailField}>
                  + Add Another
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Allow viewing photos</span>
                    </div>
                    <Switch
                      checked={emailPermissions.canView}
                      onCheckedChange={(checked) =>
                        setEmailPermissions({ ...emailPermissions, canView: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Allow downloading photos</span>
                    </div>
                    <Switch
                      checked={emailPermissions.canDownload}
                      onCheckedChange={(checked) =>
                        setEmailPermissions({ ...emailPermissions, canDownload: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Allow favoriting photos</span>
                    </div>
                    <Switch
                      checked={emailPermissions.canFavorite}
                      onCheckedChange={(checked) =>
                        setEmailPermissions({ ...emailPermissions, canFavorite: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-expiry">Expiration Date (Optional)</Label>
                <Input
                  id="email-expiry"
                  type="datetime-local"
                  value={emailExpiry}
                  onChange={(e) => setEmailExpiry(e.target.value)}
                />
              </div>

              <Button onClick={createEmailShares} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Share Album
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
