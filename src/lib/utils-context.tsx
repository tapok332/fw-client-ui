'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  formatCurrency, 
  formatCO2Reduction, 
  addBigDecimal, 
  multiplyBigDecimal 
} from './utils';
import { api } from '@/lib/api';
import type { CategoryIcon } from '@/types';
import { Coffee, Croissant, Leaf, ShoppingCart, Utensils, Candy } from 'lucide-react';

// Local type for hero images used in the UI context
interface HeroImageData {
  id: number;
  key: string;
  url: string;
  icon: string;
}

// Map of icon names to icon components for category icons
const iconComponentMap: Record<string, JSX.Element> = {
  "croissant": <Croissant className="w-4 h-4 mr-1" />,
  "coffee": <Coffee className="w-4 h-4 mr-1" />,
  "utensils": <Utensils className="w-4 h-4 mr-1" />,
  "shopping-cart": <ShoppingCart className="w-4 h-4 mr-1" />,
  "candy": <Candy className="w-4 h-4 mr-1" />,
  "leaf": <Leaf className="w-4 h-4 mr-1" />,
};

// Default fallback category icons if API fails 
const fallbackCategoryIcons: Record<string, JSX.Element> = {
  "bakery": <Croissant className="w-4 h-4 mr-1" />,
  "cafe": <Coffee className="w-4 h-4 mr-1" />,
  "restaurant": <Utensils className="w-4 h-4 mr-1" />,
  "grocery": <ShoppingCart className="w-4 h-4 mr-1" />,
  "sweets": <Candy className="w-4 h-4 mr-1" />,
  "other": <Leaf className="w-4 h-4 mr-1" />,
};

// Fallback hero images in case API fails
const fallbackHeroImages = [
  { id: 1, key: "saveFood", url: "https://picsum.photos/1200/600", icon: "🍞" },
  { id: 2, key: "saveMoney", url: "https://picsum.photos/1200/600", icon: "💰" },
  { id: 3, key: "savePlanet", url: "https://picsum.photos/1200/600", icon: "🌍" },
];

// Extend the existing UtilsContextType with UI resources
interface UtilsContextType {
  // Original utility functions
  formatCurrency: (value: string | number, currency?: string) => string;
  formatCO2Reduction: (value: string | null | undefined, precision?: number) => string;
  addBigDecimal: (a: string, b: string) => string;
  multiplyBigDecimal: (a: string, b: number) => string;
  
  // UI resources
  heroImages: HeroImageData[];
  categoryIcons: Record<string, JSX.Element>;
  iconComponentMap: Record<string, JSX.Element>;
  isLoading: boolean;
}

// Create context with default values
const UtilsContext = createContext<UtilsContextType>({
  // Default utility functions
  formatCurrency,
  formatCO2Reduction,
  addBigDecimal,
  multiplyBigDecimal,
  
  // Default UI resources
  heroImages: fallbackHeroImages,
  categoryIcons: fallbackCategoryIcons,
  iconComponentMap: iconComponentMap,
  isLoading: false
});

export function UtilsProvider({ children }: { children: ReactNode }) {
  // State for UI resources
  const [heroImages, setHeroImages] = useState(fallbackHeroImages);
  const [categoryIcons, setCategoryIcons] = useState<Record<string, JSX.Element>>(fallbackCategoryIcons);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch UI resources when component mounts
  useEffect(() => {
    const fetchSharedData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch hero images and category icons in parallel
        const [heroImagesResult, categoryIconsResult] = await Promise.all([
          api.heroImages.getAll().catch(() => fallbackHeroImages),
          api.categoryIcons.getAll().catch(() => [])
        ]);
        
        // Update hero images
        setHeroImages(heroImagesResult as HeroImageData[]);
        
        // Process category icons from API
        if (categoryIconsResult && categoryIconsResult.length > 0) {
          const iconMap: Record<string, JSX.Element> = {};
          categoryIconsResult.forEach((icon: CategoryIcon) => {
            // Get the component for this icon name or use a default
            const iconComponent = iconComponentMap[icon.icon] || fallbackCategoryIcons.other;
            iconMap[icon.name] = iconComponent;
          });
          setCategoryIcons(iconMap);
        }
      } catch (error) {
        console.error('Failed to fetch shared UI data:', error);
        // Use fallbacks in case of error (already set as initial state)
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSharedData();
  }, []);

  // Combine utility functions and UI resources
  const contextValue: UtilsContextType = {
    // Utility functions
    formatCurrency,
    formatCO2Reduction,
    addBigDecimal,
    multiplyBigDecimal,
    
    // UI resources
    heroImages,
    categoryIcons,
    iconComponentMap,
    isLoading
  };

  return (
    <UtilsContext.Provider value={contextValue}>
      {children}
    </UtilsContext.Provider>
  );
}

export function useUtils(): UtilsContextType {
  const context = useContext(UtilsContext);
  if (!context) {
    throw new Error('useUtils must be used within a UtilsProvider');
  }
  return context;
}
