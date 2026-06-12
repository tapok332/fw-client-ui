'use client';

import {useEffect} from 'react';

export default function ErrorSuppressor() {
    useEffect(() => {
        // The original console.error function
        const originalConsoleError = console.error;

        // Override console.error to filter out noise
        console.error = function (...args) {
            const errorString = args.join(' ');

            // Suppress chrome extension errors
            if (errorString.includes('chrome-extension://') &&
                (errorString.includes('ERR_FILE_NOT_FOUND') ||
                    errorString.includes('utils.js') ||
                    errorString.includes('extensionState.js') ||
                    errorString.includes('heuristicsRedefinitions.js'))) {
                return;
            }

            // Suppress hydration mismatch caused by browser extensions (Bybit wallet, etc.)
            if (errorString.includes('hydrat') &&
                (errorString.includes('data-bybit') ||
                    errorString.includes('data-grammarly') ||
                    errorString.includes('data-dashlane'))) {
                return;
            }

            // Suppress network/fetch errors when API is unavailable (already handled gracefully)
            if (errorString.includes('Failed to fetch') ||
                errorString.includes('API_NETWORK_ERROR') ||
                errorString.includes('API_SERVICE_UNAVAILABLE') ||
                errorString.includes('Load failed')) {
                return;
            }

            originalConsoleError.apply(console, args);
        };

        // Override fetch for extension resources
        const originalFetch = window.fetch;
        window.fetch = function (...args: Parameters<typeof fetch>) {
            const url = args[0]?.toString() || '';
            if (url.startsWith('chrome-extension://') &&
                (url.includes('utils.js') ||
                    url.includes('extensionState.js') ||
                    url.includes('heuristicsRedefinitions.js'))) {
                return Promise.resolve(new Response('', {
                    status: 200,
                    statusText: 'OK'
                }));
            }
            return originalFetch.apply(this, args);
        };

        // Prevent extension resource errors in console
        const errorListener = function (event: ErrorEvent) {
            if (event.filename && event.filename.startsWith('chrome-extension://')) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        };

        window.addEventListener('error', errorListener, true);

        // Suppress unhandled rejection noise from network errors
        const rejectionListener = function (event: PromiseRejectionEvent) {
            const reason = event.reason?.message || String(event.reason);
            if (reason.includes('Failed to fetch') ||
                reason.includes('API_NETWORK_ERROR') ||
                reason.includes('API_SERVICE_UNAVAILABLE') ||
                reason.includes('Load failed')) {
                event.preventDefault();
            }
        };

        window.addEventListener('unhandledrejection', rejectionListener);

        return () => {
            console.error = originalConsoleError;
            window.fetch = originalFetch;
            window.removeEventListener('error', errorListener, true);
            window.removeEventListener('unhandledrejection', rejectionListener);
        };
    }, []);

    return null;
}
