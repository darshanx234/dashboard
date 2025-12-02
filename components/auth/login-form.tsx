"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { getDefaultHomePage } from "@/lib/auth/role-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Loader2, ArrowLeft, Phone, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { motion, AnimatePresence } from "framer-motion";
import { OtpInput } from '@/components/ui/otp-input';

// Validation schemas
const phoneSchema = Yup.object({
  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number')
    .required('Phone number is required'),
});

const otpSchema = Yup.object({
  otp: Yup.string()
    .matches(/^\d{6}$/, 'OTP must be 6 digits')
    .required('OTP is required'),
});

type LoginStep = 'phone' | 'otp';

export function LoginForm() {
  const [step, setStep] = useState<LoginStep>('phone');
  const [error, setError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const router = useRouter();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: 'easeOut' as const }
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.2, ease: 'easeIn' as const }
    }
  };

  // Phone Form
  const phoneForm = useFormik({
    initialValues: { phone: '' },
    validationSchema: phoneSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError("");
      try {
        const response = await fetch('/api/otp/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: values.phone, purpose: 'login' }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send OTP');
        }

        setPhoneNumber(values.phone);
        setStep('otp');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send OTP');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // OTP Form
  const otpForm = useFormik({
    initialValues: { otp: '' },
    validationSchema: otpSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError("");
      try {
        // 1. Verify OTP
        const verifyResponse = await fetch('/api/otp/verify-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: phoneNumber,
            otp: values.otp,
            purpose: 'login'
          }),
        });

        const verifyData = await verifyResponse.json();

        if (!verifyResponse.ok) {
          throw new Error(verifyData.error || 'Invalid OTP');
        }

        // 2. Login
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phoneNumber }),
        });

        const loginData = await loginResponse.json();

        if (!loginResponse.ok) {
          throw new Error(loginData.error || 'Login failed');
        }

        // 3. Store session and redirect
        useAuthStore.setState({
          user: loginData.user,
          token: loginData.token,
        });

        const homePage = getDefaultHomePage(loginData.user.role);
        router.push(homePage);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleResendOTP = async () => {
    setError("");
    try {
      const response = await fetch('/api/otp/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, purpose: 'login' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }

      alert('OTP sent successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-0 shadow-none">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription>
            {step === 'phone'
              ? 'Enter your mobile number to sign in'
              : 'Enter the verification code sent to your phone'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.form
                key="phone-form"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={phoneForm.handleSubmit}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 border rounded-md bg-muted text-muted-foreground">
                      <span className="text-sm font-medium">+91</span>
                    </div>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="1234567890"
                      maxLength={10}
                      className={` ${phoneForm.touched.phone && phoneForm.errors.phone ? 'border-destructive' : ''}`}
                      value={phoneForm.values.phone}
                      onChange={phoneForm.handleChange}
                      onBlur={phoneForm.handleBlur}
                      disabled={phoneForm.isSubmitting}
                    />
                  </div>
                  {phoneForm.touched.phone && phoneForm.errors.phone && (
                    <p className="text-sm text-destructive">{phoneForm.errors.phone}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={phoneForm.isSubmitting}
                >
                  {phoneForm.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Get OTP"
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.div
                key="otp-form"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('phone')}
                  className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Change Number
                </Button>

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Code sent to <span className="font-semibold text-foreground">+91 {phoneNumber}</span>
                  </p>
                </div>

                <form onSubmit={otpForm.handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="sr-only">OTP</Label>
                    <OtpInput
                      value={otpForm.values.otp}
                      onChange={(val) => otpForm.setFieldValue('otp', val)}
                      disabled={otpForm.isSubmitting}
                      autoFocus
                    />
                    {otpForm.touched.otp && otpForm.errors.otp && (
                      <p className="text-sm text-center text-destructive">{otpForm.errors.otp}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={otpForm.isSubmitting}
                  >
                    {otpForm.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Login"
                    )}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={handleResendOTP}
                      className="text-sm text-muted-foreground"
                    >
                      Didn't receive code? Resend
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Create an account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

