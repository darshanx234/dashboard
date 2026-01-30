'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorMessage, Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Loader2, Info, ShieldEllipsis, Wallet } from 'lucide-react';
import Link from 'next/link';
import { albumApi } from '@/lib/api/albums';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AlbumPlanSelector, AlbumPlan } from '@/components/shared/albums/album-plan-selector';



export default function CreateAlbumPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [eventTypes, setEventTypes] = useState<Array<{ _id: string; eventtypename: string; id: string }>>([]);
  const [loadingEventTypes, setLoadingEventTypes] = useState(true);

  // Plan state
  const [plans, setPlans] = useState<AlbumPlan[]>([]);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [loadingPlans, setLoadingPlans] = useState(true);



  // Fetch plans, wallet balance, and event types on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch event types
        const eventTypesResponse = await fetch('/api/event-types');
        const eventTypesData = await eventTypesResponse.json();
        if (eventTypesData.success) {
          setEventTypes(eventTypesData.eventTypes);
        }

        // Fetch plans
        const plansResponse = await fetch('/api/album-plans');
        const plansData = await plansResponse.json();
        if (plansData.success) {
          setPlans(plansData.plans);
          // Auto-select recommended plan
          const recommended = plansData.plans.find((p: AlbumPlan) => p.isRecommended);
          // if (recommended) {
          //   setFieldValue('planId', recommended._id);
          // }
        }

        // Fetch wallet balance
        const walletResponse = await fetch('/api/wallet');
        const walletData = await walletResponse.json();
        if (walletData.success) {
          setUserBalance(walletData.wallet.balance);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          title: 'Warning',
          description: 'Failed to load some data',
          variant: 'destructive',
        });
      } finally {
        setLoadingEventTypes(false);
        setLoadingPlans(false);
      }
    };

    fetchData();
  }, [toast]);
  return (
    <Formik
      initialValues={{
        title: '',
        description: '',
        eventType: '',
        shootDate: undefined as Date | undefined,
        location: '',
        isPrivate: false,
        hasPassword: false,
        password: '',
        allowDownloads: true,
        allowFavorites: true,
        planId: '',
      }}
      validationSchema={Yup.object({
        title: Yup.string()
          .required('Album title is required')
          .min(3, 'Title must be at least 3 characters')
          .max(100, 'Title must not exceed 100 characters')
          .trim(),
        description: Yup.string()
          .max(500, 'Description must not exceed 500 characters')
          .trim(),
        eventType: Yup.string().required('Event type is required'),
        shootDate: Yup.date().nullable().required('Event date is required'),
        location: Yup.string()
          .max(200, 'Location must not exceed 200 characters')
          .trim(),
        // isPrivate: Yup.boolean(),
        // hasPassword: Yup.boolean(),
        // password: Yup.string()
        //   .when('hasPassword', {
        //     is: true,
        //     then: (schema) => schema
        //       .required('Password is required when password protection is enabled')
        //       .min(4, 'Password must be at least 4 characters')
        //       .max(50, 'Password must not exceed 50 characters'),
        //     otherwise: (schema) => schema.notRequired(),
        //   }),
        // allowDownloads: Yup.boolean(),
        // allowFavorites: Yup.boolean(),
        planId: Yup.string().required('Please select an album plan'),
      })}
      onSubmit={async (values, { setSubmitting }) => {
        try {
          const { album } = await albumApi.createAlbum({
            title: values.title.trim(),
            description: values.description.trim() || "",
            eventType: values.eventType || "",
            shootDate: values.shootDate ? format(values.shootDate, 'yyyy-MM-dd') : "",
            location: values.location.trim() || "",
            // isPrivate: values.isPrivate,
            // password: values.hasPassword && values.password ? values.password : undefined,
            // allowDownloads: values.allowDownloads,
            // allowFavorites: values.allowFavorites,
            planId: values.planId,
          });

          toast({
            title: 'Success',
            description: 'Album created successfully',
          });

          // Redirect to the album page to upload photos
          router.push(`/albums/${album._id}`);
        } catch (error: any) {
          console.error('Create album error:', error);
          toast({
            title: 'Error',
            description: error.message || 'Failed to create album',
            variant: 'destructive',
          });
        } finally {
          setSubmitting(false);
        }
      }}>
      {({ values, setFieldValue, handleChange, handleBlur, isSubmitting }) => {
        return (
          <>
            <Form>
              {/* Header */}
              <div className='flex justify-between items-center'>
                <div>
                  <h1 className="text-lg xl:text-2xl font-bold">Create New Album</h1>
                  <span className="text-sm text-muted-foreground mt-2">
                    Fill in the details below to create a new photo album
                  </span>
                </div>
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                  <Link href="/albums" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <ArrowLeft className="h-6 w-6" />
                    <span className='hidden md:block'>Back to Albums</span>
                  </Link>
                </div>
              </div>

              {/* Album Metadata Form */}
              <Card className='mt-4'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <div className='text-green-700 w-10 h-10 bg-green-200 rounded-xl flex items-center justify-center'>
                      <Info />
                    </div>
                    Album Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Album Title */}
                  <div className="space-y-2 mt-5">
                    <Label htmlFor="title">
                      Album Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., Wedding - Sarah & John"
                      value={values.title}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                    />
                    <ErrorMessage component="div" name="title" className='text-red-500 text-xs' />
                    <p className="text-xs text-muted-foreground">
                      Give your album a descriptive name
                    </p>
                  </div>

                  {/* Description */}
                  {/* <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add details about this album..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Provide context or notes about this album
              </p>
            </div> */}
                  {/* Date and Location Row */}
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Event Date */}
                    <div className="space-y-2">
                      <Label htmlFor="date">Event Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            disabled={isSubmitting}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {values.shootDate ? format(values.shootDate, 'PPP') : <span className="text-muted-foreground">Select date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={values.shootDate}
                            onSelect={(date) => setFieldValue('shootDate', date)}
                            disabled={isSubmitting}
                          />
                        </PopoverContent>
                      </Popover>
                      <ErrorMessage component="div" name="shootDate" className='text-red-500 text-xs' />
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="location"
                          name="location"
                          placeholder="e.g., Central Park, NY"
                          className="pl-9"
                          value={values.location}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled={isSubmitting}
                        />
                      </div>
                      <ErrorMessage component="div" name="location" className='text-red-500 text-xs' />
                    </div>

                    {/* Event Type */}
                    <div className="space-y-2">
                      <Label htmlFor="eventType">Event Type</Label>
                      <Select
                        // value={values.eventType}
                        onValueChange={(value) => setFieldValue('eventType', value)}
                      // disabled={isSubmitting || loadingEventTypes}
                      >
                        <SelectTrigger id="eventType" className="w-full">
                          <SelectValue placeholder={loadingEventTypes ? "Loading event types..." : "Select event type (optional)"} />
                        </SelectTrigger>
                        <SelectContent>
                          {eventTypes.map((type) => (
                            <SelectItem key={type._id} value={type._id}>
                              {type.eventtypename}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <ErrorMessage component="div" name="eventType" className='text-red-500 text-xs' />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plan Selection */}
              <Card className='mt-4'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <div className='w-10 h-10 bg-purple-200 text-purple-700 rounded-xl flex items-center justify-center'>
                      <Wallet />
                    </div>
                    Select Album Plan *
                  </CardTitle>
                  {/* <CardDescription>
                      Choose a plan based on your storage needs. Your wallet balance: ₹{userBalance}
                    </CardDescription> */}
                </CardHeader>
                <CardContent className="mt-5">
                  {loadingPlans ? (
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <AlbumPlanSelector
                        plans={plans}
                        selectedPlanId={values.planId}
                        onSelectPlan={(planId) => setFieldValue('planId', planId)}
                        userBalance={userBalance}
                        disabled={isSubmitting}
                      />
                      <ErrorMessage component="div" name="planId" className='text-red-500 text-xs' />
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Privacy Settings */}
              {false && <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <div className='w-10 h-10 bg-sky-200 text-sky-700 rounded-xl flex items-center justify-center'>
                      <ShieldEllipsis />
                    </div>
                    Privacy & Sharing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 mt-5">
                  {/* Private/Public Toggle */}
                  <div className='grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4'>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Private Album</Label>
                        <p className="text-sm text-muted-foreground">
                          Only accessible via shared link
                        </p>
                      </div>
                      <Switch
                        checked={values.isPrivate}
                        onCheckedChange={(checked) => setFieldValue('isPrivate', checked)}
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Password Protection */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Password Protection</Label>
                          <p className="text-sm text-muted-foreground">
                            Require password to access
                          </p>
                        </div>
                        <Switch
                          checked={values.hasPassword}
                          onCheckedChange={(checked) => setFieldValue('hasPassword', checked)}
                          disabled={isSubmitting}
                        />
                      </div>
                      {values.hasPassword && (
                        <>
                          <Input
                            type="password"
                            name="password"
                            placeholder="Enter album password"
                            value={values.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={isSubmitting}
                          />
                          <ErrorMessage component="div" name='password' className='text-red-500 text-xs' />
                        </>
                      )}
                    </div>

                    {/* Download Permission */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Allow Downloads</Label>
                        <p className="text-sm text-muted-foreground">
                          Let viewers download photos
                        </p>
                      </div>
                      <Switch
                        checked={values.allowDownloads}
                        onCheckedChange={(checked) => setFieldValue('allowDownloads', checked)}
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Favorites Feature */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Favorites</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow clients to mark favorite photos
                        </p>
                      </div>
                      <Switch
                        checked={values.allowFavorites}
                        onCheckedChange={(checked) => setFieldValue('allowFavorites', checked)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4 justify-end">

                <Button type="submit" size="lg" className="" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Creating...' : 'Create Album & Upload Photos'}
                </Button>
                <Button type="button" size="lg" variant="outline" asChild disabled={isSubmitting}>
                  <Link href="/albums">Cancel</Link>
                </Button>
              </div>
            </Form >
          </>
        )
      }}
    </Formik>
  );
}
