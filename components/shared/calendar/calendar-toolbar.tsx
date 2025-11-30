'use client';

import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { View } from 'react-big-calendar';

interface CalendarToolbarProps {
    view: View;
    onViewChange: (view: View) => void;
    onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
    label: string;
    onAddEvent: () => void;
}

export function CalendarToolbar({
    view,
    onViewChange,
    onNavigate,
    label,
    onAddEvent,
}: CalendarToolbarProps) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onNavigate('PREV')}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => onNavigate('TODAY')}>
                    Today
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onNavigate('NEXT')}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold ml-2">{label}</h2>
            </div>

            <div className="flex items-center gap-2">
                <Select value={view} onValueChange={(value) => onViewChange(value as View)}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="agenda">Agenda</SelectItem>
                    </SelectContent>
                </Select>

                <Button onClick={onAddEvent}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event
                </Button>
            </div>
        </div>
    );
}
