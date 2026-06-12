import React from 'react';
import { Order } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Leaf } from 'lucide-react';
import { useTranslation } from '@/contexts/locale-context';
import { useUtils } from '@/lib/utils-context';
import { formatMoney } from '@/lib/utils';

export function OrderItem({ order, onClick }: { order: Order; onClick?: () => void }) {
  const { t } = useTranslation();
  const { formatCurrency, formatCO2Reduction } = useUtils();
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  // Get badge color based on status
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
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            {t('profile', 'order')} #{order.id.substring(0, 8)}
          </CardTitle>
          <Badge variant={getBadgeVariant(order.status) as any}>
            {t('profile', order.status.toLowerCase()) || t('profile', 'unknownStatus')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 py-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">{t('profile', 'store')}</p>
            <p className="font-medium">{order.storeName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{formatDate(order.createdAt)}</p>
            {order.status === 'ready' && order.pickupCode && (
              <p className="font-medium">
                {t('profile', 'pickupCode')}: <span className="text-primary">{order.pickupCode}</span>
              </p>
            )}
          </div>
        </div>
        
        {/* Eco impact section */}
        {order.ecoImpact && (
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-950 rounded-md text-xs">
            <div className="flex items-center gap-1 text-green-700 dark:text-green-300">
              <Leaf className="h-3 w-3" />
              <span>{t('checkout', 'ecoImpact')}:</span>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <div>
                <span className="text-muted-foreground">{t('orders', 'moneySaved')}: </span>
                <span className="font-medium">{formatCurrency(order.ecoImpact.moneySaved ?? '0')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">CO₂: </span>
                <span className="font-medium">{formatCO2Reduction(order.ecoImpact.co2ReducedKg ?? null)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-2 flex items-center justify-between">
        <div className="font-semibold">
          {t('profile', 'total')}: {formatMoney(order.totalPrice)}
        </div>
        <Button variant="ghost" size="sm" className="gap-1" onClick={onClick}>
          {t('profile', 'orderDetails')}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
