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
        <Card className="group relative overflow-hidden hover:shadow-md transition-all duration-300 border-muted/60 hover:border-primary/50">
            <Link href={`/clients/${client._id}`} className="absolute inset-0 z-0" />

            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-background shadow-sm ring-2 ring-muted/30 group-hover:ring-primary/20 transition-all">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                                {initials}
                            </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                                    {fullName}
                                </h3>
                                {isActive && (
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-medium bg-primary/10 text-primary border-0 flex-shrink-0">
                                        Active
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                {client.email && (
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span className="truncate">{client.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onEdit(client)}>
                                Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/clients/${client._id}`}>View Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(client)}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                                Delete Client
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50 relative z-10">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <Image className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-sm">{client.albumIds?.length || 0}</p>
                            <p className="text-xs text-muted-foreground truncate">Albums Created</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-sm">{eventsCount}</p>
                            <p className="text-xs text-muted-foreground truncate">Events Linked</p>
                        </div>
                    </div>
                </div>

                {(client.phone || client.address) && (
                    <div className="mt-4 pt-3 border-t border-border/50 space-y-2 relative z-10">
                        {client.phone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{client.phone}</span>
                            </div>
                        )}
                        {client.address && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{client.address}</span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
