import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Regular expression to match Next.js image optimization URLs
const IMAGE_REGEX = /^\/_next\/image\?/;

/**
 * Middleware that adds caching headers to image requests
 * and helps manage retries for external image requests
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Only process image optimization requests
  if (IMAGE_REGEX.test(url.pathname) || url.pathname.startsWith('/_next/image')) {
    const response = NextResponse.next();

    // Add caching headers for optimized images
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

    // Extract the retry count if it exists in the URL
    const retryParam = url.searchParams.get('retry');

    if (retryParam) {
      const retryCount = parseInt(retryParam, 10);

      // Add a custom header to track retry attempts
      response.headers.set('X-Image-Retry-Count', retryParam);

    }

    return response;
  }

  return NextResponse.next();
}

// Configure the paths that should trigger this middleware
export const config = {
  matcher: [
    '/_next/image(.+)',
  ],
};
