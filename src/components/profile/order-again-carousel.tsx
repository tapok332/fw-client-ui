"use client";

import React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { SurpriseBox, Store } from "@/types";
import { useLocale } from "@/contexts/locale-context";

interface OrderAgainCarouselProps {
  items: (SurpriseBox | Store)[];
}

export function OrderAgainCarousel({ items }: Readonly<OrderAgainCarouselProps>) {
  const { t } = useLocale();

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <ScrollArea 
      className="w-full pb-4" 
      aria-roledescription="carousel"
    >
      <div 
        className="flex space-x-4 pb-4 overflow-x-auto snap-x snap-mandatory" 
        role="list" 
        aria-label={t("profile", "orderAgain")}
      >
        {items.map((item) => (
          <RestaurantCard 
            key={item.id} 
            item={item} 
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

interface RestaurantCardProps {
  item: SurpriseBox | Store;
}

import { useImageLoader } from "@/hooks/use-image-loader";

function RestaurantCard({ item }: Readonly<RestaurantCardProps>) {
  // Type guard to check if the item is a SurpriseBox
  const isBox = 'storeName' in item;
  
  // Safely access properties for either type
  const name = isBox ? item.storeName : item.name;
  const image = isBox ? item.storeImage : ('heroUrl' in item ? item.heroUrl : undefined);
  const rating = isBox ? undefined : item.rating;
  const storeId = isBox ? item.storeId : item.id;
  
  // Ensure image URL is absolute
  const imageUrl = (() => {
    // If empty, use placeholder
    if (!image) return '/images/placeholder.jpg';
    
    // If already absolute URL with http/https, use as is
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    
    // If relative but starting with slash, it's fine for Next.js
    if (image.startsWith('/')) {
      return image;
    }
    
    // Otherwise, make it relative with leading slash
    return `/${image}`;
  })();
  
  // Determine if this is an external URL (for unoptimized flag)
  const isExternalUrl = imageUrl.startsWith('http') && 
    !imageUrl.startsWith('/') && 
    !imageUrl.startsWith('http://localhost') && 
    !imageUrl.startsWith('https://localhost');
    
  // Use custom image loader hook with exponential backoff strategy
  const imageLoader = useImageLoader({
    src: imageUrl,
    fallbackSrc: '/images/placeholder.jpg',
    maxRetries: 5,
    initialRetryDelay: 300, // Start with short delay and increase exponentially
  });

  return (
    <Link 
      href={`/stores/${storeId}`} 
      className="snap-start flex-shrink-0 cursor-pointer"
      role="listitem"
      aria-label={`${name}, ${rating ? `rating ${rating}` : 'no rating'}`}
    >
      <Card className="w-[140px] shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="h-[100px] relative">
          {/* Loading skeleton */}
          {imageLoader.loading && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          
          {/* Hide image during loading for better UX */}
          <div className={imageLoader.loading ? 'invisible' : 'visible'}>
            <Image 
              src={imageLoader.src}
              alt={name || ''}
              fill
              className="object-cover transition-transform hover:scale-105"
              sizes="140px"
              onError={imageLoader.onError}
              onLoad={imageLoader.onLoad}
              // Always use unoptimized for external URLs to bypass domain restriction
              unoptimized={isExternalUrl || imageLoader.isUsingFallback}
              loading="eager" // Use eager loading for these critical UI elements
            />
          </div>
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium text-sm truncate">{name}</h3>
          {rating && (
            <div className="flex items-center mt-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
              <span className="text-xs">{rating.toFixed(1)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
