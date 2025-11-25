'use client';

import { Client } from '@/lib/api/clients';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Phone, MoreVertical, Calendar, Image, MapPin } from 'lucide-react';
import Link from 'next/link';

interface ClientCardProps {
    client: Client;
    onEdit: (client: Client) => void;
    onDelete: (client: Client) => void;
    eventsCount?: number;
}

export function ClientCard({ client, onEdit, onDelete, eventsCount = 0 }: ClientCardProps) {
    const initials = `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase();
    const fullName = `${client.firstName} ${client.lastName}`;

    const isActive = eventsCount > 0 || (client.albumIds?.length || 0) > 0;

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                        <Avatar className="h-14 w-14 bg-primary">
                            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                                {initials}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Link
                                    href={`/clients/${client._id}`}
                                    className="font-semibold text-lg hover:underline transition-colors"
                                >
                                    {fullName}
                                </Link>
                                {isActive && (
                                    <Badge variant="secondary" className="text-xs">
                                        Active
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-1.5 mt-2">
                                {client.email && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span className="truncate">{client.email}</span>
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span>{client.phone}</span>
                                    </div>
                                )}
                                {client.address && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span className="truncate">{client.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(client)}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/clients/${client._id}`}>View Details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(client)}
                                className="text-red-600"
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Stats Footer */}
                <div className="flex items-center gap-4 pt-4 border-t">
                    <div className="flex items-center gap-1.5 text-sm">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                            <Image className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-semibold">{client.albumIds?.length || 0}</p>
                            <p className="text-xs text-muted-foreground">Albums</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-semibold">{eventsCount}</p>
                            <p className="text-xs text-muted-foreground">Events</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
