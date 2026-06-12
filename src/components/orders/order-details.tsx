import React from 'react';
import { Order } from '@/types';
import { useTranslation } from '@/contexts/locale-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, ArrowLeft, Leaf } from 'lucide-react';
import { formatMoney, formatLineTotal } from '@/lib/utils';
import { useUtils } from '@/lib/utils-context';

type OrderDetailsProps = {
  order: Order;
  onBack: () => void;
};

export function OrderDetails({ order, onBack }: OrderDetailsProps) {
  const { t } = useTranslation();
  const { formatCurrency, formatCO2Reduction } = useUtils();
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };
  
  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };
  
  // Get badge variant based on status
  const getBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'ready':
        return 'info';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-2" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">
          {t('profile', 'orderDetails')}
        </h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('profile', 'orderInformation')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('profile', 'orderDate')}
              </p>
              <p>{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('profile', 'orderTime')}
              </p>
              <p>{formatTime(order.createdAt)}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t('profile', 'orderStatus')}
            </p>
            <Badge className="mt-1" variant={getBadgeVariant(order.status) as any}>
              {t('profile', order.status.toLowerCase()) || t('profile', 'unknownStatus')}
            </Badge>
          </div>
          
          {order.pickupCode && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('profile', 'pickupCode')}
              </p>
              <p className="text-xl font-bold text-primary">{order.pickupCode}</p>
            </div>
          )}
          
          {/* Eco impact card */}
          {order.ecoImpact && (
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg mt-2">
              <div className="flex items-center gap-1 mb-2 text-green-800 dark:text-green-300">
                <Leaf className="h-4 w-4" />
                <p className="font-medium">{t('checkout', 'ecoImpact')}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('orders', 'moneySaved')}</p>
                  <p className="font-bold text-green-700 dark:text-green-400">
                    {formatCurrency(order.ecoImpact.moneySaved ?? '0')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('orders', 'co2Saved')}</p>
                  <p className="font-bold text-green-700 dark:text-green-400">
                    {formatCO2Reduction(order.ecoImpact.co2ReducedKg ?? null)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('profile', 'storeInformation')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-lg font-medium">{order.storeName}</p>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <MapPin className="h-4 w-4" />
              <p>123 Store Address, City</p> {/* This would come from the store info */}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Phone className="h-4 w-4" />
              <p>+1 234 567 8900</p> {/* This would come from the store info */}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              {t('profile', 'contactStore')}
            </Button>
            <Button variant="outline" size="sm">
              {t('profile', 'getDirections')}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('profile', 'orderItems')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('orders', 'quantity')}: {item.quantity}
                  </p>
                </div>
                <p className="font-medium">
                  {formatLineTotal(item.price, item.quantity)}
                </p>
              </div>
            ))}
            
            <Separator />
            
            <div className="flex justify-between items-center font-bold">
              <p>{t('profile', 'total')}</p>
              <p>{formatMoney(order.totalPrice)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {order.status === 'pending' && (
        <Button variant="destructive" className="w-full">
          {t('profile', 'cancelOrder')}
        </Button>
      )}
      
      <Button variant="outline" className="w-full">
        {t('profile', 'helpWithOrder')}
      </Button>
    </div>
  );
}
