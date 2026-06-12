'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, MapPin, PlusCircle, Trash2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Address } from '@/types/user';
import { api, apiState } from '@/lib/api';
import { AddressForm } from '@/components/address/address-form';
import { AddressFormValues, composeFullAddress } from '@/lib/validation/address-schema';
import { ErrorBoundary } from '@/components/error/error-boundary';

export default function AddressesPage() {
  const { requireAuth } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    requireAuth();
    fetchAddresses();
  }, [requireAuth, retryCount]);

  const fetchAddresses = async () => {
    if (apiState.serviceUnavailable) {
      router.push('/error?type=service-unavailable');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.addresses.getAll();
      setAddresses(response.data || []);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      
      // Check if the service is unavailable
      if (error instanceof Error && 
         (error.message === 'API_SERVICE_UNAVAILABLE' || apiState.serviceUnavailable)) {
        router.push('/error?type=service-unavailable');
        return;
      }
      
      setError(error instanceof Error ? error : new Error('Unknown error'));
      
      toast({
        title: t("common", "error"),
        description: t("address", "failedToLoad"),
        variant: "destructive",
      });
      
      // Use mock data if API fails but service is not marked as unavailable
      setAddresses([
        { 
          id: '1', 
          title: t('address', 'home'), 
          fullAddress: 'Khreshchatyk St, 1, Kyiv, Ukraine',
          street: 'Khreshchatyk St, 1',
          city: 'Kyiv',
          state: '',
          postalCode: '01001',
          country: 'Ukraine',
          addressType: 'HOME', 
          coordinates: { latitude: 50.4501, longitude: 30.5234 },
          isDefault: true
        },
        { 
          id: '2', 
          title: t('address', 'work'), 
          fullAddress: 'Velyka Vasylkivska St, 100, Kyiv, Ukraine',
          street: 'Velyka Vasylkivska St, 100',
          city: 'Kyiv',
          state: '',
          postalCode: '01001',
          country: 'Ukraine',
          addressType: 'WORK', 
          coordinates: { latitude: 50.4311, longitude: 30.5164 },
          isDefault: false
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    setLoading(true);
    try {
      const response = await api.addresses.setDefault(id);
      
      // Update addresses list with the new default address
      setAddresses(prevAddresses => 
        prevAddresses.map(address => ({
          ...address,
          isDefault: address.id === id
        }))
      );
      
      toast({
        title: t("common", "success"),
        description: t("address", "defaultUpdated"),
      });
    } catch (error) {
      console.error('Failed to set default address:', error);
      toast({
        title: t("common", "error"),
        description: t("address", "failedToUpdate"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAddress = async (id: string) => {
    // Don't allow removing the default address
    if (addresses.find(a => a.id === id)?.isDefault) {
      toast({
        title: t("common", "error"),
        description: t("address", "cannotRemoveDefault"),
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      await api.addresses.delete(id);
      setAddresses(prevAddresses => prevAddresses.filter(address => address.id !== id));
      
      toast({
        title: t("common", "success"),
        description: t("address", "addressRemoved"),
      });
    } catch (error) {
      console.error('Failed to remove address:', error);
      toast({
        title: t("common", "error"),
        description: t("address", "failedToRemove"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (values: AddressFormValues) => {
    const payload: Omit<Address, 'id'> = {
      ...values,
      fullAddress: composeFullAddress(values),
      // Geocoding stub: a real backend resolves fullAddress → coordinates.
      coordinates: { latitude: 50 + Math.random() * 0.2, longitude: 30 + Math.random() * 0.2 },
    };
    const response = await api.addresses.create(payload);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to save address');
    }
    setAddresses(prev => [...prev, response.data]);
    setShowAddressForm(false);
    toast({
      title: t('common', 'success'),
      description: t('address', 'addressAdded'),
    });
  };

  // If there's an error but service is not completely unavailable,
  // provide a retry button
  const ErrorFallback = () => (
    <div className="flex flex-col items-center justify-center py-8">
      <p className="text-muted-foreground mb-4">{t('address', 'loadingError')}</p>
      <Button 
        variant="outline" 
        onClick={() => setRetryCount(prev => prev + 1)}
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        {t('common', 'retry')}
      </Button>
    </div>
  );
  
  return (
    <ErrorBoundary>
      <div className="container max-w-4xl px-4 py-6 space-y-6">
        <div className="flex items-center mb-4">
          <Link href="/profile" className="mr-2" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">{t('profile', 'addresses')}</h1>
        </div>
  
        {showAddressForm ? (
          <AddressForm
            onSubmit={handleAddAddress}
            onCancel={() => setShowAddressForm(false)}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{t('address', 'yourAddresses')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <ErrorFallback />
              ) : addresses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('address', 'noAddresses')}</p>
              </div>
            ) : (
              addresses.map(address => (
                <div key={address.id}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium break-words">{address.title}</p>
                      <p className="text-sm text-muted-foreground break-words">{address.fullAddress}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        <span className="inline-block px-2 py-0.5 bg-muted rounded-full mr-2">
                          {address.addressType}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!address.isDefault ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSetDefaultAddress(address.id)}
                            disabled={loading}
                          >
                            {t('address', 'makeDefault')}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveAddress(address.id)}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{t('address', 'default')}</span>
                      )}
                    </div>
                  </div>
                  <Separator className="my-3" />
                </div>
              ))
            )}
            
            <Button 
              className="w-full mt-4 gap-2" 
              variant="outline"
              onClick={() => setShowAddressForm(true)}
              disabled={loading}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('address', 'addNewAddress')}</span>
            </Button>
          </CardContent>
        </Card>
      )}
      
      <div className="text-sm text-muted-foreground p-4 border rounded-md">
        <h2 className="font-medium text-base mb-2">{t('address', 'addressInformation')}</h2>
        <p className="mb-1">• {t('address', 'defaultAddressCheckout')}</p>
        <p className="mb-1">• {t('address', 'multipleAddresses')}</p>
        <p>• {t('address', 'accurateInformation')}</p>
      </div>
    </div>
          </ErrorBoundary>
  );
}
