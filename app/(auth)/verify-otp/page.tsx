'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email') || '';
  const purpose = searchParams.get('purpose') || 'email-verification';
  const redirect = searchParams.get('redirect') || '/';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Countdown timer for resend
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Initialize OTP expiry
  useEffect(() => {
    const expiryParam = searchParams.get('expiresAt');
    if (expiryParam) {
      setExpiresAt(new Date(expiryParam));
    }
  }, [searchParams]);

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setError('OTP has expired. Please request a new one.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Auto-focus first input
  useEffect(() => {
    const firstInput = document.getElementById('otp-0');
    if (firstInput) {
      (firstInput as HTMLInputElement).focus();
    }
  }, []);

  // Handle OTP input change
  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }

    // Auto-submit when all fields are filled
    if (newOtp.every((digit) => digit !== '') && value) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);

      // Focus last input
      const lastInput = document.getElementById('otp-5');
      if (lastInput) {
        (lastInput as HTMLInputElement).focus();
      }

      // Auto-submit
      handleVerifyOTP(pastedData);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (otpCode: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode, purpose }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Verification failed');

        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }

        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        const firstInput = document.getElementById('otp-0');
        if (firstInput) {
          (firstInput as HTMLInputElement).focus();
        }

        setLoading(false);
        return;
      }

      // Success
      setSuccess(true);
      setError('');

      // Store reset token if password reset
      if (data.resetToken) {
        sessionStorage.setItem('resetToken', data.resetToken);
      }

      // Redirect after success
      setTimeout(() => {
        if (purpose === 'password-reset') {
          router.push('/auth/reset-password');
        } else {
          router.push(redirect);
        }
      }, 1500);

    } catch (error) {
      setError('Network error. Please try again.');
      setOtp(['', '', '', '', '', '']);
      const firstInput = document.getElementById('otp-0');
      if (firstInput) {
        (firstInput as HTMLInputElement).focus();
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    setError('');

    try {
      const response = await fetch('/api/otp/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to resend OTP');

        if (data.retryAfter) {
          setResendCooldown(data.retryAfter);
        }

        setResendLoading(false);
        return;
      }

      // Update expiry time
      if (data.expiresAt) {
        setExpiresAt(new Date(data.expiresAt));
      }

      // Set cooldown
      setResendCooldown(data.cooldown || 60);

      // Clear previous OTP
      setOtp(['', '', '', '', '', '']);
      setRemainingAttempts(null);

      // Show success message temporarily
      setError('');
      const successMsg = document.createElement('div');
      successMsg.textContent = 'OTP sent successfully!';
      successMsg.className = 'text-green-600 text-sm font-medium';

    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // Format time (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get purpose display text
  const getPurposeText = () => {
    const texts: Record<string, { title: string; description: string }> = {
      'signup': {
        title: 'Complete Your Registration',
        description: 'Enter the 6-digit code sent to your email to activate your account.',
      },
      'login': {
        title: 'Verify Your Login',
        description: 'Enter the 6-digit code sent to your email to continue.',
      },
      'password-reset': {
        title: 'Reset Your Password',
        description: 'Enter the 6-digit code sent to your email to reset your password.',
      },
      'email-verification': {
        title: 'Verify Your Email',
        description: 'Enter the 6-digit code sent to your email to verify your account.',
      },
    };

    return texts[purpose] || texts['email-verification'];
  };

  const { title, description } = getPurposeText();

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Request</CardTitle>
            <CardDescription>Email address is required for verification.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="">
      <Card className="w-full max-w-md border-0 shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">{title}</CardTitle>
          <CardDescription className="text-center">{description}</CardDescription>
          <div className="pt-2 text-center">
            <span className="text-sm text-muted-foreground">Code sent to:</span>
            <p className="font-medium">{email}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Success Message */}
          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Verification successful! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          {/* OTP Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-center block">
              Enter Verification Code
            </label>
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <div>
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={loading || success}
                    className="w-12 h-12 text-center text-lg font-bold border rounded-md focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Time Remaining */}
          {timeRemaining > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              Code expires in: <span className="font-medium">{formatTime(timeRemaining)}</span>
            </div>
          )}

          {/* Resend Button */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Didn't receive the code?</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResendOTP}
              disabled={resendCooldown > 0 || resendLoading || success}
              className="w-full"
            >
              {resendLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                'Resend Code'
              )}
            </Button>
          </div>
        </CardContent>
        {/* Error Message */}
        {error && !success && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {remainingAttempts !== null && remainingAttempts > 0 && (
                <span className="block mt-1 text-sm">
                  {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
        <CardFooter>
          <Button variant="ghost" asChild className="w-full">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
