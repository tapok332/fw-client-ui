'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Mail, Home, Coffee } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ProfileDto } from '@/types';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { ProfileSkeleton } from '@/components/profile/profile-skeleton';
import { Section } from '@/components/ui/section';

// Define validation schema with zod
const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  address: z.string().optional(),
  preferences: z.string().optional()
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileEditPage() {
  const { requireAuth } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize form with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      address: '',
      preferences: ''
    }
  });
  
  useEffect(() => {
    if (!requireAuth()) return;

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const profileData = await api.user.getProfile();
        
        if (profileData) {
          setProfile(profileData);
          // Set form values
          setValue('name', profileData.name);
          setValue('address', (profileData.addresses && profileData.addresses.length > 0 ? profileData.addresses[0].street : '') || '');
          setValue('preferences', profileData.preferences || '');
        } else {
          toast({
            title: t('common', 'error'),
            description: t('profile', 'profileNotFound'),
            variant: 'destructive',
          });
          router.push('/profile');
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast({
          title: t('common', 'error'),
          description: t('profile', 'errorLoadingProfile'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [requireAuth, toast, t, router, setValue]);

  const handleAvatarUpload = async (file: File) => {
    try {
      const result = await api.user.uploadAvatar(file);

      if (result.success && result.data) {
        // Update the profile with the new avatar URL
        setProfile(prev => prev ? { ...prev, avatar: result.data.avatarUrl } : null);
        toast({
          title: t('profile', 'photoUpdated'),
        });
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await api.user.updateProfile({
        name: data.name,
        preferences: data.preferences,
      });
      toast({
        title: t('common', 'saved'),
      });
      
      // Navigate back to profile after successful update
      setTimeout(() => router.push('/profile'), 500);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[720px] mx-auto px-4 md:px-6 py-6 pb-[calc(env(safe-area-inset-bottom)+72px)]">
        <div className="flex items-center mb-6">
          <Link href="/profile" className="mr-3" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">{t('profile', 'personalData')}</h1>
        </div>
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 md:px-6 py-6 pb-[calc(env(safe-area-inset-bottom)+72px)]">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <Link href="/profile" className="mr-3" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">{t('profile', 'personalData')}</h1>
      </div>

      {/* Profile avatar card */}
      <Card className="mb-6">
        <CardContent className="p-6 md:p-8 flex items-center">
          <AvatarUpload 
            name={profile?.name || ''} 
            current={profile?.avatar} 
            onUpload={handleAvatarUpload}
            size="lg"
          />
          <div className="ml-4">
            <h2 className="text-lg font-semibold">{profile?.name}</h2>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Form section */}
      <Section title={t('profile', 'personalInfo')}>
        <Card>
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {/* Name field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-muted-foreground" />
                    {t('profile', 'name')}
                  </Label>
                  <Input
                    id="name"
                    className="min-h-[44px]"
                    placeholder={t('profile', 'yourName')}
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Address field */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center">
                    <Home className="w-4 h-4 mr-2 text-muted-foreground" />
                    {t('profile', 'address')}
                  </Label>
                  <Input
                    id="address"
                    className="min-h-[44px]"
                    placeholder={t('profile', 'yourAddress')}
                    {...register('address')}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                  )}
                </div>

                {/* Preferences field */}
                <div className="space-y-2">
                  <Label htmlFor="preferences" className="flex items-center">
                    <Coffee className="w-4 h-4 mr-2 text-muted-foreground" />
                    {t('profile', 'preferences')}
                  </Label>
                  <Textarea
                    id="preferences"
                    className="min-h-[100px]"
                    placeholder={t('profile', 'yourPreferencesPlaceholder')}
                    {...register('preferences')}
                  />
                  {errors.preferences && (
                    <p className="text-red-500 text-sm mt-1">{errors.preferences.message}</p>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full py-3 text-base rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('common', 'saving') : t('profile', 'saveChanges')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
