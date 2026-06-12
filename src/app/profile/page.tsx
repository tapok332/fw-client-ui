'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/contexts/auth-context';
import {useLocale} from '@/contexts/locale-context';
import {api, apiState} from '@/lib/api';
import {formatCurrency} from '@/lib/utils';
import {ProfileDto, Store, SurpriseBox} from '@/types';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Section} from '@/components/ui/section';
import {ChevronItem, List} from '@/components/ui/list';
import {AvatarUpload} from '@/components/ui/avatar-upload';
import {Button} from '@/components/ui/button';
import {OrderAgainCarousel} from '@/components/profile/order-again-carousel';
import {ProfileSkeleton} from '@/components/profile/profile-skeleton';
import {ErrorBoundary} from '@/components/error/error-boundary';
import {useToast} from '@/hooks/use-toast';
import {CreditCard, Gift, HelpCircle, History, Leaf, LogOut, MapPin, RefreshCw, Settings, Sprout, TreePine, Users} from 'lucide-react';
import {motion} from 'framer-motion';

const fadeUp = (delay: number) => ({
    initial: {opacity: 0, y: 16},
    animate: {opacity: 1, y: 0},
    transition: {duration: 0.4, delay},
});

export default function ProfilePage() {
    const [profile, setProfile] = useState<ProfileDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [recentStores, setRecentStores] = useState<(SurpriseBox | Store)[]>([]);
    const [error, setError] = useState<Error | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const {logout, requireAuth} = useAuth();
    const {t} = useLocale();
    const router = useRouter();
    const {toast} = useToast();

    // Extract first name for greeting
    const firstName = profile?.name?.split(' ')[0] ?? '';

    useEffect(() => {
        if (!requireAuth()) return;

        // Track component mount state
        let isMounted = true;
        
        // Reset error state on retry
        setError(null);
        
        const fetchProfileData = async () => {
            // If component unmounted, don't proceed
            if (!isMounted) return;
            
            try {
                setIsLoading(true);
                
                // If service is already known to be unavailable, redirect immediately
                if (apiState.serviceUnavailable) {
                    router.push('/error?type=service-unavailable');
                    return;
                }
                
                try {
                    // Fetch profile data
                    const profileData = await api.user.getProfile();
                    
                    // Check if component is still mounted before updating state
                    if (!isMounted) return;
                    
                    setProfile(profileData);
                    
                    // Make a separate request for recent orders
                    try {
                        const ordersResponse = await api.orders.getAll(0, 5); // Get up to 5 recent orders
                        
                        if (!isMounted) return;
                        
                        if (ordersResponse && ordersResponse.data && ordersResponse.data.orders.length > 0) {
                            // Extract unique stores with their info directly from the orders
                            const orderStores = ordersResponse.data.orders
                                .filter(order => order.storeInfo) // Only include orders with store info
                                .map(order => {
                                    // Get the full avatar URL as is, without modifications
                                    const avatarUrl = order.storeInfo?.avatar ?? '';
                                    
                                    return {
                                        id: order.storeId,
                                        name: order.storeName,
                                        heroUrl: avatarUrl, // Use the full URL as provided by the API
                                        address: order.storeInfo?.address ?? '',
                                        coordinates: order.storeInfo?.coordinates || { latitude: 0, longitude: 0 },
                                        // Add other required Store properties with defaults
                                        description: '',
                                        category: '',
                                        rating: 0
                                    } as unknown as Store;
                                });
                            
                            // Get unique stores by ID
                            const uniqueStores = Array.from(
                                new Map(orderStores.map(store => [store.id, store])).values()
                            ).slice(0, 3); // Limit to 3 stores
                            
                            if (!isMounted) return;
                            setRecentStores(uniqueStores);
                        }
                    } catch (ordersError) {
                        console.error("Failed to fetch user orders:", ordersError);
                        // Continue anyway since profile data is already loaded
                    }
                } catch (error) {
                    console.error("Failed to fetch profile data:", error);
                    
                    if (!isMounted) return;
                    
                    // Check if the service is unavailable
                    if (error instanceof Error && 
                       (error.message === 'API_SERVICE_UNAVAILABLE' || apiState.serviceUnavailable)) {
                        router.push('/error?type=service-unavailable');
                        return;
                    }
                    
                    // Store the error for UI handling
                    setError(error instanceof Error ? error : new Error('Unknown error'));
                    
                    // Display specific message for retry limit exceeded
                    if (error instanceof Error && error.message.includes('Too many failed attempts')) {
                        toast({
                            title: t('common', 'error'),
                            description: t('profile', 'reloadPageToRetry'),
                            variant: "destructive"
                        });
                    } else {
                        toast({
                            title: t('common', 'error'),
                            description: t('profile', 'errorLoadingProfile'),
                            variant: "destructive"
                        });
                    }
                }
            } catch (error) {
                if (isMounted) {
                    console.error("Unexpected error in profile page:", error);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
    
        fetchProfileData();
        
        // Cleanup function to prevent state updates after unmount
        return () => {
            isMounted = false;
        };
    }, [requireAuth, retryCount]); // Reduce dependencies to minimize unnecessary re-renders

    const handleAvatarUpload = async (file: File) => {
        try {
            // Use the API endpoint to upload the avatar
            const response = await api.user.uploadAvatar(file);
            
            if (response.success && response.data && response.data.avatarUrl) {
                // Update the profile with the new avatar URL
                setProfile(prev => prev ? { ...prev, avatar: response.data?.avatarUrl } : null);

                toast({
                    title: t('profile', 'photoUpdated'),
                });
            }
        } catch (error) {
            console.error("Failed to upload avatar:", error);
            toast({
                title: t('common', 'error'),
                variant: "destructive"
            });
        }
    };

    // Render skeleton during loading
    if (isLoading) {
        return (
            <div className="max-w-[720px] mx-auto px-4 md:px-6 py-6 pb-[calc(env(safe-area-inset-bottom)+72px)]">
                <ProfileSkeleton/>
            </div>
        );
    }

    // Custom error UI with retry option
    if (error && !apiState.serviceUnavailable) {
        return (
            <div className="max-w-[720px] mx-auto px-4 md:px-6 py-6 flex flex-col items-center justify-center h-[50vh]">
                <p className="text-muted-foreground mb-4">{t('profile', 'errorLoadingProfile')}</p>
                <Button 
                    onClick={() => setRetryCount(prev => prev + 1)}
                    className="mb-3"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('common', 'retry')}
                </Button>
                <Button 
                    variant="outline" 
                    onClick={() => router.push('/')}
                >
                    {t('common', 'backHome')}
                </Button>
            </div>
        );
    }
    
    if (!profile) {
        return (
            <div className="max-w-[720px] mx-auto px-4 md:px-6 py-6 flex flex-col items-center justify-center h-[50vh]">
                <p className="text-muted-foreground mb-4">{t('profile', 'profileNotFound')}</p>
                <Button onClick={() => router.push('/')}>{t('common', 'backHome')}</Button>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="max-w-[720px] mx-auto px-4 md:px-6 py-6 space-y-6 pb-[calc(env(safe-area-inset-bottom)+72px)]">
            {/* Header with greeting and avatar */}
            <motion.div {...fadeUp(0)} className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl font-[family-name:var(--font-heading)]">
                        {t('profile', 'hi')}, {firstName}
                    </h1>
                </div>
                <AvatarUpload
                    name={profile.name}
                    current={profile.avatar}
                    onUpload={handleAvatarUpload}
                    size="lg"
                />
            </motion.div>

            {/* Eco Impact Cards */}
            <motion.div {...fadeUp(0.1)} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground rounded-2xl p-4 shadow-[0_4px_16px_rgba(30,122,58,0.2)]">
                    <Sprout className="w-5 h-5 mb-2 opacity-80" />
                    <p className="text-2xl font-bold">{formatCurrency(String(profile.statistics?.savings ?? 0))}</p>
                    <p className="text-xs opacity-85 mt-0.5">{t('profile', 'savings')}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-700 to-teal-600 text-primary-foreground rounded-2xl p-4 shadow-[0_4px_16px_rgba(30,122,58,0.2)]">
                    <TreePine className="w-5 h-5 mb-2 opacity-80" />
                    <p className="text-2xl font-bold">{profile.statistics?.co2ReducedKg ?? 0} {t('common', 'kg')}</p>
                    <p className="text-xs opacity-85 mt-0.5">CO2 {t('profile', 'reduced')}</p>
                </div>
                <div className="bg-gradient-to-br from-green-700 to-emerald-500 text-primary-foreground rounded-2xl p-4 shadow-[0_4px_16px_rgba(30,122,58,0.2)]">
                    <Leaf className="w-5 h-5 mb-2 opacity-80" />
                    <p className="text-2xl font-bold">{profile.statistics?.itemsSaved ?? 0}</p>
                    <p className="text-xs opacity-85 mt-0.5">{t('profile', 'mealsSaved')}</p>
                </div>
            </motion.div>

            {/* Order Again Section */}
            {recentStores && recentStores.length > 0 && (
                <motion.div {...fadeUp(0.2)}>
                    <Section title={t('profile', 'orderAgain')}>
                        <OrderAgainCarousel items={recentStores}/>
                    </Section>
                </motion.div>
            )}

            {/* Main Content */}
            <div className="space-y-6">
                    {/* Popular Links */}
                    <motion.div {...fadeUp(0.3)}>
                    <Section title={t('profile', 'popularLinks')}>
                        <List>
                            <ChevronItem
                                href="/invite"
                                label={t('profile', 'inviteFriends')}
                                icon={<Users className="h-5 w-5 text-primary/60"/>}
                            />
                            <ChevronItem
                                href="/activate-code"
                                label={t('profile', 'activateCode')}
                                icon={<Gift className="h-5 w-5 text-primary/60"/>}
                            />
                            <ChevronItem
                                href="/orders/history"
                                label={t('profile', 'ordersHistory')}
                                description={profile.statistics?.ordersCompleted ? `${profile.statistics.ordersCompleted} ${t('profile', 'orders')}` : undefined}
                                icon={<History className="h-5 w-5 text-primary/60"/>}
                            />
                            <ChevronItem
                                href="/support"
                                label={t('profile', 'support')}
                                icon={<HelpCircle className="h-5 w-5 text-primary/60"/>}
                            />
                        </List>
                    </Section>
                    </motion.div>

                    {/* Settings */}
                    <motion.div {...fadeUp(0.4)}>
                    <Section title={t('profile', 'settings')}>
                        <List>
                            <ChevronItem
                                href="/profile/edit"
                                label={t('profile', 'personalData')}
                                icon={<Settings className="h-5 w-5 text-primary/60"/>}
                            />
                            <ChevronItem
                                href="/payment-methods"
                                label={t('profile', 'paymentMethods')}
                                description={profile.paymentMethods?.length ? `${profile.paymentMethods.length} ${t('profile', 'cards')}` : undefined}
                                icon={<CreditCard className="h-5 w-5 text-primary/60"/>}
                            />
                            <ChevronItem
                                href="/addresses"
                                label={t('profile', 'addresses')}
                                description={profile.addresses?.length ? `${profile.addresses.length} ${t('profile', 'addresses')}` : undefined}
                                icon={<MapPin className="h-5 w-5 text-primary/60"/>}
                            />
                        </List>
                    </Section>
                    </motion.div>
            </div>

            {/* Logout Button */}
            <motion.div {...fadeUp(0.5)} className="mt-8 pb-8">
                <Button
                    variant="outline"
                    className="w-full py-3 text-destructive hover:bg-destructive/5 hover:text-destructive border-destructive/20 rounded-xl"
                    onClick={() => {
                        logout();
                        router.push('/');
                    }}
                >
                    <LogOut className="h-5 w-5 mr-2"/>
                    {t('auth', 'logout')}
                </Button>
            </motion.div>
            </div>
                    </ErrorBoundary>
    );
}