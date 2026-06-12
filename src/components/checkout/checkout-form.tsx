'use client';

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/contexts/locale-context";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { useUtils } from "@/lib/utils-context";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Leaf, ShoppingBag, CreditCard, MapPin, CheckCircle } from "lucide-react";
import { ProfileDto } from "@/types";
import { formatMoney, formatLineTotal, moneyAmount } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function CheckoutForm() {
  const { t } = useTranslation();
  const { cart, createOrder } = useData();
  const { requireAuth } = useAuth();
  const { formatCurrency, formatCO2Reduction } = useUtils();
  const router = useRouter();
  
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estimated eco impact calculation (would come from backend in real app)
  const cartTotalAmount = moneyAmount(cart.totalPrice);
  const estimatedEcoImpact = {
    moneySaved: ((cartTotalAmount * 0.3).toFixed(2)).toString(), // Assuming 30% savings
    co2ReducedKg: ((cartTotalAmount * 0.25).toFixed(2)).toString() // Rough estimate based on price
  };

  useEffect(() => {
    if (!requireAuth()) return;
    api.user.getProfile()
      .then((data) => setProfile(data))
      .catch(console.error);
  }, [requireAuth]);

  if (!profile) {
    return <div className="flex items-center justify-center h-full"><Spinner /></div>;
  }

  const handleSubmitOrder = async () => {
    if (cart.items.length === 0) return;
    
    setIsProcessing(true);
    try {
      const order = await createOrder();
      if (order) {
        router.push(`/orders/${order.id}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container max-w-4xl px-4 py-6 space-y-6 md:py-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold md:text-2xl">{t('orders', 'checkout')}</h1>
        <Avatar className="w-10 h-10 md:w-12 md:h-12">
          <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t('orders', 'customerDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('profile', 'name')}</p>
              <p className="font-medium">{profile.name}</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">{t('profile', 'address')}</p>
              </div>
              <p className="font-medium">{(profile.addresses && profile.addresses.length > 0 ? profile.addresses[0].street : '') || t('orders', 'pickupAtStore')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>{t('orders', 'paymentMethod')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t('orders', 'payAtPickup')}</p>
                <p className="text-sm text-muted-foreground">{t('orders', 'paymentOnCollection')}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-primary ml-auto" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t('orders', 'orderSummary')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Items */}
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div key={item.boxId} className="flex justify-between">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × {formatMoney(item.price)}
                    </p>
                  </div>
                </div>
                <p className="font-medium">
                  {formatLineTotal(item.price, item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <Separator />

          {/* Store info */}
          {cart.items.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('profile', 'store')}</p>
              <p className="font-medium">{cart.items[0].storeName}</p>
            </div>
          )}

          {/* Eco impact */}
          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg mt-2">
            <div className="flex items-center gap-1 mb-2 text-green-800 dark:text-green-300">
              <Leaf className="h-4 w-4" />
              <p className="font-medium">{t('checkout', 'ecoImpact')}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('profile', 'savings')}</p>
                <p className="font-bold text-green-700 dark:text-green-400">
                  {formatCurrency(estimatedEcoImpact.moneySaved)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CO₂ {t('profile', 'saved')}</p>
                <p className="font-bold text-green-700 dark:text-green-400">
                  {formatCO2Reduction(estimatedEcoImpact.co2ReducedKg)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center font-bold">
            <p>{t('profile', 'total')}</p>
            <p>{formatMoney(cart.totalPrice)}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleSubmitOrder}
            disabled={isProcessing || cart.items.length === 0}
          >
            {isProcessing ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <ShoppingBag className="mr-2 h-4 w-4" />
            )}
            {isProcessing ? t('orders', 'processing') : t('orders', 'confirmOrder')}
          </Button>
        </CardFooter>
      </Card>

      {/* Additional information */}
      <Card>
        <CardContent className="pt-6">
          <CardDescription className="text-center">
            {t('orders', 'checkoutDisclaimer')}
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
