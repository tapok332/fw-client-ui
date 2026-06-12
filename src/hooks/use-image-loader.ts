import { useState, useEffect, useRef } from 'react';

interface UseImageLoaderOptions {
  src: string;
  fallbackSrc: string;
  maxRetries?: number;
  initialRetryDelay?: number;
}

/**
 * Custom hook for loading images with exponential backoff retry mechanism
 */
export function useImageLoader({
  src,
  fallbackSrc,
  maxRetries = 5,
  initialRetryDelay = 300,
}: UseImageLoaderOptions) {
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallbackSrc);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [retries, setRetries] = useState<number>(0);
  
  // Use ref for timeouts to clean them up on unmount
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle empty or undefined src gracefully
  const validSrc = src && src.trim() !== '' ? src : fallbackSrc;

  useEffect(() => {
    // Reset states when source changes
    setLoading(true);
    setError(false);
    setRetries(0);
    setCurrentSrc(validSrc);
    
    // Clean up timeout on unmount or when src changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [validSrc]);

  const handleError = () => {
    // If the image is already the fallback and it errors, do nothing
    if (currentSrc === fallbackSrc) {
      setLoading(false);
      setError(true);
      return;
    }
    
    if (retries < maxRetries) {
      // Increment retry counter
      const nextRetry = retries + 1;
      setRetries(nextRetry);
      
      // Calculate exponential backoff delay (300ms, 600ms, 1200ms, etc.)
      const backoffDelay = initialRetryDelay * Math.pow(2, nextRetry - 1);
      
      // Wait before retrying with exponential backoff
      timeoutRef.current = setTimeout(() => {
        // Add timestamp as cache-busting parameter to force reload
        setCurrentSrc(`${validSrc}?retry=${nextRetry}&t=${Date.now()}`);
      }, backoffDelay);
    } else {
      // Max retries reached, use fallback
      console.warn(`Max retries (${maxRetries}) reached for image: ${validSrc}`);
      setCurrentSrc(fallbackSrc);
      setError(true);
      setLoading(false);
    }
  };

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  return {
    src: currentSrc,
    loading,
    error,
    retries,
    onError: handleError,
    onLoad: handleLoad,
    isUsingFallback: currentSrc === fallbackSrc,
  };
}
