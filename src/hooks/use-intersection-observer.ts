import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
  enabled?: boolean;
}

/**
 * Custom hook that utilizes the Intersection Observer API to detect when an
 * element is visible in the viewport.
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLElement>(
  options: UseIntersectionObserverProps = {}
): [React.RefObject<T>, boolean] {
  const { threshold = 0, root = null, rootMargin = '0px', enabled = true } = options;
  
  const elementRef = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);
  
  useEffect(() => {
    const element = elementRef.current;
    
    if (!enabled || !element) {
      return;
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold, root, rootMargin }
    );
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, enabled]);
  
  return [elementRef, isIntersecting];
}
