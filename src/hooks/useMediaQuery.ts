import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design that detects if a media query matches
 * @param query The media query to check against (e.g., "(min-width: 768px)")
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false on server to prevent hydration mismatch
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create the media query list
    const mediaQueryList = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQueryList.matches);

    // Define the change handler
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add the event listener
    mediaQueryList.addEventListener('change', handleChange);
    
    // Clean up
    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query]); // Only re-run effect if query changes

  return matches;
}
