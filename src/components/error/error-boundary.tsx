'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { apiState } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/locale-context';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  isServiceUnavailable: boolean;
}

// HOC for adding locale to ErrorBoundary
export const withLocale = (Component: React.ComponentType<any>) => {
  return function WithLocaleComponent(props: any) {
    const { t } = useLocale();
    return <Component {...props} t={t} />;
  };
};

class ErrorBoundaryClass extends Component<Props & { t: (namespace: string, key: string) => string }, State> {
  public state: State = {
    hasError: false,
    isServiceUnavailable: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true, isServiceUnavailable: apiState.serviceUnavailable };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { t } = this.props;
    
    if (this.state.hasError) {
      if (this.state.isServiceUnavailable) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
            <div className="w-16 h-16 text-red-500 mb-4">
              <AlertTriangle className="w-full h-full" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {t('error', 'serviceUnavailable')}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t('error', 'tryAgainLater')}
            </p>
            <Button 
              onClick={() => {
                apiState.resetServiceState();
                window.location.href = '/';
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('error', 'backToHome')}
            </Button>
          </div>
        );
      }
      
      // Show custom fallback or default error message
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">
            {t('error', 'somethingWentWrong')}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t('error', 'pleaseTryAgain')}
          </p>
          <Button 
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('error', 'refresh')}
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = withLocale(ErrorBoundaryClass);
