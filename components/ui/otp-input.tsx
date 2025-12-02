import React, { useRef, useEffect } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface OtpInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
    autoFocus?: boolean;
}

export function OtpInput({ length = 6, value, onChange, disabled, className, autoFocus }: OtpInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (autoFocus) {
            inputRefs.current[0]?.focus();
        }
    }, [autoFocus]);

    const handleChange = (index: number, val: string) => {
        // Allow only numbers
        if (!/^\d*$/.test(val)) return;

        // Take the last character if multiple characters are entered (e.g. via autocomplete sometimes)
        const char = val.slice(-1);

        const newOtp = value.split('');
        // Pad with empty strings if value is shorter than length
        while (newOtp.length < length) newOtp.push('');

        newOtp[index] = char;

        const combinedOtp = newOtp.join('').slice(0, length);
        onChange(combinedOtp);

        // Move focus to next input if a digit was entered
        if (char && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            // If current input is empty and we're not at the start, move to previous
            if (!value[index] && index > 0) {
                const newOtp = value.split('');
                while (newOtp.length < length) newOtp.push('');

                // Clear previous input
                newOtp[index - 1] = '';
                onChange(newOtp.join('').slice(0, length));

                inputRefs.current[index - 1]?.focus();
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, length);
        if (!/^\d+$/.test(pastedData)) return;

        onChange(pastedData);

        // Focus the input after the pasted content
        const nextIndex = Math.min(pastedData.length, length - 1);
        inputRefs.current[nextIndex]?.focus();
    };

    // Helper to get the digit at a specific index
    const getDigit = (index: number) => {
        return value[index] || '';
    };

    return (
        <div className={cn("flex gap-2 justify-center", className)}>
            {Array.from({ length }).map((_, index) => (
                <div key={index}>
                    <Input
                        ref={(el) => { inputRefs.current[index] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={getDigit(index)}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        disabled={disabled}
                        className="w-10 h-10 text-center text-5xl p-0 focus-visible:ring-purple-600 focus-visible:border-transparent"
                    />
                </div>
            ))}
        </div>
    );
}
