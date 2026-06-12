import { useState, useEffect, useRef, RefObject } from 'react';

interface UseIntersectionObserverProps {
  enabled?: boolean;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Hook for detecting when an element intersects with the viewport
 * Useful for infinite scrolling and lazy loading
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>({
  enabled = true,
  threshold = 0.1,
  rootMargin = '0px',
}: UseIntersectionObserverProps = {}): [RefObject<T>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(elementRef.current);

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [enabled, rootMargin, threshold]);

  return [elementRef, isIntersecting];
}
