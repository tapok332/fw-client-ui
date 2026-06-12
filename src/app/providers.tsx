'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { LocaleProvider } from '@/contexts/locale-context';
import { Toaster } from '@/components/ui/toaster';
import RootErrorBoundary from './layout';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <RootErrorBoundary>
          {children}
          <Toaster />
        </RootErrorBoundary>
      </AuthProvider>
    </LocaleProvider>
  );
}
