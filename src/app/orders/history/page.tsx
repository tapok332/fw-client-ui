'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Check, Clock, ShoppingBag, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Order } from '@/types';
import { formatMoney, formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  const { requireAuth } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!requireAuth()) return;

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        try {
          const response = await api.orders.getAll(page, pageSize);
  
          if (response && response.data && Array.isArray(response.data.orders)) {
            // Backend returns PaginatedOrdersResponse: { orders, page, size, totalElements, totalPages }
            const ordersData = response.data.orders;

            if (page === 0) {
              setOrders(ordersData);
            } else {
              setOrders(prev => [...prev, ...ordersData]);
            }

            setHasMore((response.data.page + 1) < response.data.totalPages);
          } else {
            setOrders([]);
            setHasMore(false);
          }
        } catch (error) {
          console.error("Failed to fetch orders:", error);
          
          // Handle retry limit exceeded
          if (error instanceof Error && error.message.includes('Too many failed attempts')) {
            toast({
              title: t('common', 'error'),
              description: t('orders', 'reloadPageToRetry'),
              variant: "destructive"
            });
          } else {
            toast({
              title: t('common', 'error'),
              description: t('orders', 'errorLoadingOrders'),
              variant: "destructive"
            });
          }
          
          // If page > 0, keep existing orders but stop pagination
          if (page > 0) {
            setHasMore(false);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [requireAuth, page, t, toast]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const getStatusIcon = (status: string) => {
    switch ((status ?? '').toLowerCase()) {
      case 'completed':
        return <Check className="h-5 w-5 text-primary" />;
      case 'cancelled':
        return <X className="h-5 w-5 text-red-500" />;
      case 'pending':
      case 'confirmed':
      case 'processing':
      case 'ready':
      default:
        // Always return clock icon for unknown statuses
        return <Clock className="h-5 w-5 text-orange-500" />;
    }
  };

  // Helper function to get the correct status label using switch statement
  const getOrderStatusLabel = (status: string): string => {
    switch((status ?? '').toLowerCase()) {
      case 'pending':
        return t('confirmation', 'statusPending');
      case 'confirmed':
        return t('orderStatus', 'confirmed');
      case 'processing':
        return t('confirmation', 'statusProcessing');
      case 'ready':
        return t('confirmation', 'statusReady');
      case 'completed':
        return t('confirmation', 'statusCompleted');
      case 'cancelled':
        return t('confirmation', 'statusCancelled');
      default:
        return t('orders', 'processing');
    }
  };

  return (
    <div className="max-w-[720px] mx-auto px-4 md:px-6 py-6 pb-[calc(env(safe-area-inset-bottom)+72px)]">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => router.back()}
          title={t('common', 'back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold">{t('profile', 'ordersHistory')}</h1>
      </div>

      {isLoading && page === 0 ? (
        // Loading skeleton for first page
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="w-full bg-muted/50 animate-pulse">
              <CardContent className="p-6 h-32"></CardContent>
            </Card>
          ))}
        </div>
      ) : orders.length > 0 ? (
        // Order list
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="w-full overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <Link
                  href={`/orders/${order.id}`}
                  className="block p-4 cursor-pointer hover:bg-muted/50 transition-colors rounded-xl"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage
                          src={order.storeInfo?.avatar}
                          alt={order.storeName ?? ''}
                        />
                        <AvatarFallback>{(order.storeName ?? '?').substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-lg">{order.storeName ?? t('orders', 'unknownStore', 'Заклад')}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt, true)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                    <span className="ml-2 text-sm">
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm my-2">
                    {(order.items ?? []).map((item, index) => (
                      <span key={index}>
                        {item.quantity}x {item.name}
                        {index < (order.items?.length ?? 0) - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>

                  <Separator className="my-3" />

                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      {t('orders', 'total')}:
                    </span>
                    <span className="font-semibold">
                      {formatMoney(order.totalPrice)}
                    </span>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}

          {hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isLoading}
              >
                {isLoading ? t('common', 'loading') : t('common', 'loadMore')}
              </Button>
            </div>
          )}
        </div>
      ) : (
        // Empty state
        <div className="text-center py-12">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {t('orders', 'noOrdersYet')}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t('common', 'startExploring')}
          </p>
          <Button onClick={() => router.push('/')}>
            {t('common', 'exploreNow')}
          </Button>
        </div>
      )}
    </div>
  );
}