import {QueryClient} from "@tanstack/react-query";

export function createQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Cart data changes via mutations (we invalidate explicitly). Allow short stale window for refetch-on-focus.
                staleTime: 30_000,
                gcTime: 5 * 60_000,
                retry: (failureCount, error: unknown) => {
                    // Don't retry 4xx (client errors). Retry network errors / 5xx up to 3 times.
                    const message = error instanceof Error ? error.message : "";
                    if (/^HTTP 4\d\d/.test(message)) return false;
                    if (/unauthorized|boxNotFound|invalid/i.test(message)) return false;
                    return failureCount < 3;
                },
                retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
                refetchOnWindowFocus: true,
                refetchOnReconnect: true,
            },
            mutations: {
                retry: (failureCount, error: unknown) => {
                    const message = error instanceof Error ? error.message : "";
                    // Mutations: never retry validation errors. Retry transient network failures once.
                    if (/^HTTP 4\d\d|unauthorized|invalid|boxNotFound/i.test(message)) return false;
                    return failureCount < 1;
                },
                retryDelay: 1000,
            },
        },
    });
}
