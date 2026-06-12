"use client";
import { useEffect } from "react";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/locale-context';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { apiState } from '@/lib/api';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();
  const router = useRouter();
  
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  const isServiceUnavailable = 
    error.message === 'API_SERVICE_UNAVAILABLE' || 
    apiState.serviceUnavailable;

  const handleReset = () => {
    if (isServiceUnavailable) {
      apiState.resetServiceState();
      router.push('/');
    } else {
      reset();
    }
  };

  return (
    <html lang="uk">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <div className="w-20 h-20 text-red-500 mb-6">
            <AlertTriangle className="w-full h-full" />
          </div>
          
          <h1 className="text-3xl font-bold mb-3">
            {isServiceUnavailable 
              ? t('error', 'serviceUnavailable') 
              : t('error', 'somethingWentWrong')}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto">
            {isServiceUnavailable
              ? t('error', 'serversTemporarilyUnavailable')
              : t('error', 'unexpectedErrorOccurred')}
          </p>
          
          <Button 
            size="lg"
            onClick={handleReset}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            {isServiceUnavailable
              ? t('error', 'backToHome')
              : t('error', 'tryAgain')}
          </Button>
        </div>
      </body>
    </html>
  );
}
