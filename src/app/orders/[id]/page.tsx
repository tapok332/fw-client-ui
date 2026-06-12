'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Check, Clock, MapPin, Phone, ShoppingBag, X, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Spinner } from '@/components/ui/spinner';
import { useOrderQuery } from '@/lib/queries/order-queries';
import { formatMoney } from '@/lib/utils';
import { useImageLoader } from '@/hooks/use-image-loader';

// Separate component for order item image to properly use hooks
function OrderItemImage({ src, alt }: { src: string; alt: string }) {
  const imageLoader = useImageLoader({
    src: src,
    fallbackSrc: '/images/placeholder-food.jpg',
    maxRetries: 5
  });
  
  return (
    <div className="relative w-12 h-12 overflow-hidden rounded-md flex-shrink-0">
      {/* Loading skeleton */}
      {imageLoader.loading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {/* Hide image during loading for better UX */}
      <div className={imageLoader.loading ? 'invisible' : 'visible'}>
        <Image 
          src={imageLoader.src}
          alt={alt}
          fill
          className="object-cover transition-transform hover:scale-105"
          sizes="48px"
          onError={imageLoader.onError}
          onLoad={imageLoader.onLoad}
          unoptimized={imageLoader.isUsingFallback}
          loading="eager" // Use eager loading for these critical UI elements
        />
      </div>
    </div>
  );
}

export default function OrderDetailsPage() {
  const { requireAuth } = useAuth();
  const { t } = useLocale();
  const { orders, addToCart } = useData();
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  // Seed from DataContext for an instant first paint, then let the query poll
  // for live status changes (stops once the order reaches a terminal status).
  const initialOrder = orders.find(o => o.id === orderId);
  const { data: order, isLoading } = useOrderQuery(orderId, { initialData: initialOrder });

  // Function to display order status
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return t("orderStatus", "pending");
      case 'confirmed':
        return t("orderStatus", "confirmed");
      case 'processing':
        return t("orderStatus", "processing");
      case 'ready':
        return t("orderStatus", "ready");
      case 'completed':
        return t("orderStatus", "completed");
      case 'cancelled':
        return t("orderStatus", "cancelled");
      default:
        return t("orderStatus", "unknown");
    }
  };

  // Function to determine status color and icon
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300', icon: <Clock className="w-4 h-4" /> };
      case 'confirmed':
        return { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300', icon: <ShoppingBag className="w-4 h-4" /> };
      case 'processing':
        return { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300', icon: <ShoppingBag className="w-4 h-4" /> };
      case 'ready':
        return { color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300', icon: <ShoppingBag className="w-4 h-4" /> };
      case 'completed':
        return { color: 'bg-primary/10 text-primary', icon: <Check className="w-4 h-4" /> };
      case 'cancelled':
        return { color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300', icon: <X className="w-4 h-4" /> };
      default:
        return { color: 'bg-muted text-foreground', icon: <Clock className="w-4 h-4" /> };
    }
  };

  // Function to handle reordering
  const handleReorder = async () => {
    if (!order || isReordering) return;

    setIsReordering(true);
    try {
      // For each item in the order, add it to the cart
      order.items.forEach(item => {
        // This is a simplified version - in a real app, you would need to fetch the actual surprise box data
        const boxItem = {
          id: item.id,
          boxId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          storeId: order.storeId,
          storeName: order.storeName,
          image: item.imageUrl || '/images/placeholder-food.jpg', // Use the item image or a placeholder
          description: '',
          discountedPrice: item.price,
          originalPrice: item.price,
        };

        addToCart(boxItem as any, item.quantity);
      });

      // Navigate to checkout
      router.push('/checkout');
    } catch (error) {
      console.error('Error reordering:', error);
    } finally {
      setIsReordering(false);
    }
  };

  // Function to handle get directions
  const handleGetDirections = () => {
    if (!order?.storeInfo?.coordinates) return;

    const { latitude, longitude } = order.storeInfo.coordinates;
    const address = encodeURIComponent(order.storeInfo?.address || '');
    const storeName = encodeURIComponent(order.storeName);

    // Check if the user is on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // Try to open in the native maps app
      const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}&daddr=${address}&dirflg=d`;

      // Create a fallback to Google Maps in case the redirect doesn't work
      setTimeout(() => {
        window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${storeName}&travelmode=driving`;
      }, 1000);

      window.location.href = mapsUrl;
    } else {
      // On desktop, open in Google Maps
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${storeName}&travelmode=driving`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <Spinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-4xl px-4 py-6 space-y-6">
        <div className="flex items-center mb-4">
          <Link href="/orders/history" className="mr-2" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">{t('orders', 'orderNotFound')}</h1>
        </div>

        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-medium mb-2">{t('orders', 'orderNotFound')}</h2>
              <p className="text-muted-foreground mb-6">{t('orders', 'orderNotFoundDesc')}</p>
              <Button onClick={() => router.push('/orders/history')}>
                {t('orders', 'backToHistory')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="container max-w-4xl px-4 py-6 space-y-6">
      <div className="flex items-center mb-4">
        <Link href="/orders/history" className="mr-2" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">{t('orders', 'orderNumber')}{order.id.substring(0, 8)}</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>{t('orders', 'orderDetails')}</span>
            </CardTitle>
            <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${statusInfo.color}`}>
              {statusInfo.icon}
              <span>{getStatusText(order.status)}</span>
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">{t('orders', 'orderInformation')}</h2>
            <div className="bg-slate-50 p-3 rounded-md space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('orders', 'orderDate')}:</span>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t('orders', 'orderTime')}:</span>
                <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t('orders', 'orderStatus')}:</span>
                <span className="font-medium">{getStatusText(order.status)}</span>
              </div>
              {order.status === 'ready' && (
                <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                  <p className="text-sm font-medium text-center">{t("orders", "pickupCode")}:</p>
                  <p className="text-2xl font-bold tracking-wider text-center">{order.pickupCode}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">{t('orders', 'storeInformation')}</h2>
            <div className="bg-slate-50 p-3 rounded-md space-y-2">
              <p className="font-medium">{order.storeName}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{order.storeInfo?.address || 'Khreshchatyk St, 1, Kyiv, Ukraine'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>+380 44 123 4567</span>
              </div>
              <div className="mt-2">
                <Button variant="outline" size="sm" className="w-full" onClick={handleGetDirections}>
                  {t('address', 'getDirections')}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">{t('orders', 'orderItems')}</h2>
            <div className="border rounded-md divide-y">
              {order.items.map((item, index) => (
                <div key={index} className="p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <OrderItemImage 
                      src={item.imageUrl || `/images/products/${item.id}.jpg`} 
                      alt={item.name}
                    />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{t('orders', 'quantity')}: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-medium">{formatMoney(item.price)}</p>
                </div>
              ))}
              <div className="p-3 bg-slate-50">
                <div className="flex justify-between font-bold">
                  <span>{t('orders', 'total')}</span>
                  <span>{formatMoney(order.totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {order.status === 'pending' && (
              <Button variant="outline" className="w-full text-red-500">
                {t('orders', 'cancelOrder')}
              </Button>
            )}

            <Button
              className="w-full"
              onClick={handleReorder}
              disabled={isReordering}
            >
              {isReordering ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {t('orders', 'orderAgain')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">{t('orders', 'needHelp')}</p>
        <Button variant="link" asChild>
          <Link href="/support">{t('orders', 'contactSupport')}</Link>
        </Button>
      </div>
    </div>
  );
}
