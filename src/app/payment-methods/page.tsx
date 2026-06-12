'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CreditCard, PlusCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function PaymentMethodsPage() {
  const { requireAuth } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState([
    { id: '1', type: 'card', last4: '4242', brand: t('payment', 'visa'), expMonth: 12, expYear: 2025, isDefault: true },
    { id: '2', type: 'card', last4: '1234', brand: t('payment', 'mastercard'), expMonth: 10, expYear: 2024, isDefault: false },
  ]);
  
  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  const handleSetDefaultPayment = (id: string) => {
    setPaymentMethods(prevMethods => 
      prevMethods.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
    
    toast({
      title: t("common", "success"),
      description: t("payment", "defaultUpdated"),
    });
  };

  const handleRemovePayment = (id: string) => {
    // Don't allow removing the default payment method
    if (paymentMethods.find(m => m.id === id)?.isDefault) {
      toast({
        title: t("common", "error"),
        description: t("payment", "cannotRemoveDefault"),
        variant: "destructive",
      });
      return;
    }
    
    setPaymentMethods(prevMethods => prevMethods.filter(method => method.id !== id));
    
    toast({
      title: t("common", "success"),
      description: t("payment", "paymentMethodRemoved"),
    });
  };

  return (
    <div className="container max-w-4xl px-4 py-6 space-y-6">
      <div className="flex items-center mb-4">
        <Link href="/profile" className="mr-2" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">{t('profile', 'paymentMethods')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <span>{t('profile', 'paymentMethods')}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {paymentMethods.map(method => (
            <div key={method.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {method.brand.toLowerCase() === t('payment', 'visa').toLowerCase() ? (
                    <div className="w-10 h-6 bg-blue-800 text-white rounded flex items-center justify-center text-xs font-bold">{t('payment', 'visa').toUpperCase()}</div>
                  ) : (
                    <div className="w-10 h-6 bg-red-600 text-white rounded flex items-center justify-center text-xs font-bold">{t('payment', 'mastercard').substring(0, 2).toUpperCase()}</div>
                  )}
                  <div>
                    <p className="font-medium">{method.brand} •••• {method.last4}</p>
                    <p className="text-xs text-muted-foreground">{t('payment', 'expires')} {method.expMonth}/{method.expYear}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!method.isDefault ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSetDefaultPayment(method.id)}
                      >
                        {t('payment', 'makeDefault')}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemovePayment(method.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{t('payment', 'default')}</span>
                  )}
                </div>
              </div>
              <Separator className="my-3" />
            </div>
                      ))}
                      
                      <Button 
            className="w-full mt-4 gap-2" 
            variant="outline"
            onClick={() => {
              toast({
                title: t('common', 'demoMode'),
                description: t('payment', 'demoDescription'),
              });
            }}
                      >
            <PlusCircle className="w-4 h-4" />
            <span>{t('payment', 'addPaymentMethod')}</span>
          </Button>
        </CardContent>
      </Card>
      
      <div className="text-sm text-muted-foreground p-4 border rounded-md">
        <h2 className="font-medium text-base mb-2">{t('payment', 'paymentInformation')}</h2>
        <p className="mb-1">• {t('payment', 'secureProcessing')}</p>
        <p className="mb-1">• {t('payment', 'multiplePaymentMethods')}</p>
        <p>• {t('payment', 'defaultPaymentMethod')}</p>
      </div>
    </div>
  );
}
