"use client";

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { ToastProvider } from '@/components/ui/toast';
import { LocaleProvider } from '@/contexts/locale-context';
import { CartProvider } from '@/contexts/cart-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LocaleProvider>
        <CartProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </CartProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
