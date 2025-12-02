'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, CheckCircle, Camera, Building2, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { OtpInput } from '@/components/ui/otp-input';

// Step 1: Phone Number Validation
const phoneSchema = Yup.object({
  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number')
    .required('Phone number is required'),
});

// Step 2: OTP Validation
const otpSchema = Yup.object({
  otp: Yup.string()
    .matches(/^\d{6}$/, 'OTP must be 6 digits')
    .required('OTP is required'),
});

// Step 3: Profile Details Validation
const profileSchema = Yup.object({
  userType: Yup.string()
    .oneOf(['photographer', 'studio_owner'], 'Please select a valid option')
    .required('Please select your role'),
  firstName: Yup.string().when('userType', {
    is: 'photographer',
    then: (schema) => schema.required('Name is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  businessName: Yup.string().when('userType', {
    is: 'studio_owner',
    then: (schema) => schema.required('Business name is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  email: Yup.string()
    .email('Invalid email address')
    .notRequired(),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .notRequired(),
  confirmPassword: Yup.string()
    .test('passwords-match', 'Passwords must match', function (value) {
      const { password } = this.parent;
      if (!password && !value) return true; // Both empty is ok
      return password === value;
    })
    .notRequired(),
});

type SignupStep = 'phone' | 'otp' | 'userType' | 'profile' | 'success';

export function SignupForm() {
  const [step, setStep] = useState<SignupStep>('phone');
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<string>('');
  const [selectedUserType, setSelectedUserType] = useState<'photographer' | 'studio_owner' | ''>('');
  const router = useRouter();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: 'easeOut' as const }
    },
    exit: {
      opacity: 0,
      x: -50,
      transition: { duration: 0.2, ease: 'easeIn' as const }
    }
  };

  const cardVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  // Step 1: Phone Number Form
  const phoneForm = useFormik({
    initialValues: { phone: '' },
    validationSchema: phoneSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      try {
        const response = await fetch('/api/otp/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: values.phone, purpose: 'signup' }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send OTP');
        }

        setPhoneNumber(values.phone);
        setOtpExpiresAt(data.expiresAt);
        setStep('otp');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send OTP');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Step 2: OTP Verification Form
  const otpForm = useFormik({
    initialValues: { otp: '' },
    validationSchema: otpSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      try {
        const response = await fetch('/api/otp/verify-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: phoneNumber,
            otp: values.otp,
            purpose: 'signup'
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Invalid OTP');
        }

        setStep('userType');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'OTP verification failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Step 3: Profile Details Form
  const profileForm = useFormik({
    initialValues: {
      userType: selectedUserType,
      firstName: '',
      businessName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: profileSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: phoneNumber,
            userType: values.userType,
            firstName: values.firstName || undefined,
            businessName: values.businessName || undefined,
            email: values.email || undefined,
            password: values.password || undefined,
          }),
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create account');
        }

        // Store user in auth store
        useAuthStore.setState({
          user: data.user,
          token: data.token,
        });

        setStep('success');

        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create account');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Resend OTP handler
  const handleResendOTP = async () => {
    setError('');
    try {
      const response = await fetch('/api/otp/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, purpose: 'signup' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }

      setOtpExpiresAt(data.expiresAt);
      alert('OTP sent successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    }
  };

  // User Type Selection Handler
  const handleUserTypeSelect = (type: 'photographer' | 'studio_owner') => {
    setSelectedUserType(type);
    profileForm.setFieldValue('userType', type);
    setStep('profile');
  };

  // Success Screen
  if (step === 'success') {
    return (
      <motion.div
        className="w-full max-w-md"
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <motion.div
                className="flex justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <CheckCircle className="h-16 w-16 text-green-500" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="font-semibold text-xl">Welcome to ShotsSpace!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Your account has been created successfully.
                </p>
              </motion.div>
              <motion.p
                className="text-xs text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Redirecting to dashboard...
              </motion.p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <Card className='border-0 shadow-none'>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            {step === 'phone' && 'Enter your phone number to get started'}
            {step === 'otp' && 'Verify your phone number'}
            {step === 'userType' && 'Choose your role'}
            {step === 'profile' && 'Complete your profile'}
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
            {/* Step 1: Phone Number */}
            {step === 'phone' && (
              <motion.form
                key="phone"
                onSubmit={phoneForm.handleSubmit}
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 border rounded-md bg-muted">
                      <span className="text-sm">+91</span>
                    </div>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="1234567890"
                      maxLength={10}
                      value={phoneForm.values.phone}
                      onChange={phoneForm.handleChange}
                      onBlur={phoneForm.handleBlur}
                      disabled={phoneForm.isSubmitting}
                      className={phoneForm.touched.phone && phoneForm.errors.phone ? 'border-destructive' : ''}
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
                    'Send OTP'
                  )}
                </Button>
              </motion.form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('phone')}
                  className="mb-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Change Number
                </Button>

                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    OTP sent to <span className="font-semibold">+91 {phoneNumber}</span>
                  </p>
                </div>

                <form onSubmit={otpForm.handleSubmit} className="space-y-4">
                  <div className="space-y-2 text-center">
                    <Label htmlFor="otp" className="justify-center">Enter OTP</Label>
                    <OtpInput
                      value={otpForm.values.otp}
                      onChange={(val) => otpForm.setFieldValue('otp', val)}
                      disabled={otpForm.isSubmitting}
                    />
                    {otpForm.touched.otp && otpForm.errors.otp && (
                      <p className="text-sm text-destructive">{otpForm.errors.otp}</p>
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
                      'Verify OTP'
                    )}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={handleResendOTP}
                      className="text-sm"
                    >
                      Resend OTP
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 3: User Type Selection */}
            {step === 'userType' && (
              <motion.div
                key="userType"
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className="cursor-pointer hover:border-primary transition-all"
                      onClick={() => handleUserTypeSelect('photographer')}
                    >
                      <CardContent className="pt-6 text-center space-y-3">
                        <div className="flex justify-center">
                          <div className="p-4 bg-primary/10 rounded-full">
                            <Camera className="h-8 w-8 text-primary" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Photographer</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Individual photographer
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className="cursor-pointer hover:border-primary transition-all"
                      onClick={() => handleUserTypeSelect('studio_owner')}
                    >
                      <CardContent className="pt-6 text-center space-y-3">
                        <div className="flex justify-center">
                          <div className="p-4 bg-primary/10 rounded-full">
                            <Building2 className="h-8 w-8 text-primary" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Studio Owner</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Photography studio business
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Profile Details */}
            {step === 'profile' && (
              <motion.div
                key="profile"
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('userType')}
                  className="mb-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                <form onSubmit={profileForm.handleSubmit} className="space-y-4">
                  {/* Name field for photographer */}
                  {selectedUserType === 'photographer' && (
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Your Name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="John Doe"
                        value={profileForm.values.firstName}
                        onChange={profileForm.handleChange}
                        onBlur={profileForm.handleBlur}
                        disabled={profileForm.isSubmitting}
                        className={profileForm.touched.firstName && profileForm.errors.firstName ? 'border-destructive' : ''}
                      />
                      {profileForm.touched.firstName && profileForm.errors.firstName && (
                        <p className="text-sm text-destructive">{profileForm.errors.firstName}</p>
                      )}
                    </div>
                  )}

                  {/* Business name field for studio owner */}
                  {selectedUserType === 'studio_owner' && (
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        name="businessName"
                        type="text"
                        placeholder="ABC Photography Studio"
                        value={profileForm.values.businessName}
                        onChange={profileForm.handleChange}
                        onBlur={profileForm.handleBlur}
                        disabled={profileForm.isSubmitting}
                        className={profileForm.touched.businessName && profileForm.errors.businessName ? 'border-destructive' : ''}
                      />
                      {profileForm.touched.businessName && profileForm.errors.businessName && (
                        <p className="text-sm text-destructive">{profileForm.errors.businessName}</p>
                      )}
                    </div>
                  )}

                  {/* Email (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={profileForm.values.email}
                      onChange={profileForm.handleChange}
                      onBlur={profileForm.handleBlur}
                      disabled={profileForm.isSubmitting}
                      className={profileForm.touched.email && profileForm.errors.email ? 'border-destructive' : ''}
                    />
                    {profileForm.touched.email && profileForm.errors.email && (
                      <p className="text-sm text-destructive">{profileForm.errors.email}</p>
                    )}
                  </div>

                  {/* Password (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password (Optional)</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={profileForm.values.password}
                      onChange={profileForm.handleChange}
                      onBlur={profileForm.handleBlur}
                      disabled={profileForm.isSubmitting}
                      className={profileForm.touched.password && profileForm.errors.password ? 'border-destructive' : ''}
                    />
                    {profileForm.touched.password && profileForm.errors.password && (
                      <p className="text-sm text-destructive">{profileForm.errors.password}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      You can always sign in with phone OTP
                    </p>
                  </div>

                  {/* Confirm Password (if password is entered) */}
                  {profileForm.values.password && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={profileForm.values.confirmPassword}
                        onChange={profileForm.handleChange}
                        onBlur={profileForm.handleBlur}
                        disabled={profileForm.isSubmitting}
                        className={profileForm.touched.confirmPassword && profileForm.errors.confirmPassword ? 'border-destructive' : ''}
                      />
                      {profileForm.touched.confirmPassword && profileForm.errors.confirmPassword && (
                        <p className="text-sm text-destructive">{profileForm.errors.confirmPassword}</p>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={profileForm.isSubmitting}
                  >
                    {profileForm.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 'phone' && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
