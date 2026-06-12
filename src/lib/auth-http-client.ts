import {refreshAuthTokens, tokenStorage} from "./auth-api";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

/**
 * HTTP client with automatic token refresh
 * Used for requests that require authorization
 */
export const authHttpClient = {
    // Sends GET requests
    get: async <T>(endpoint: string, customHeaders: Record<string, string> = {}): Promise<T> => {
        return authHttpClient.request<T>("GET", endpoint, undefined, customHeaders);
    },

    // Sends POST requests
    post: async <T>(endpoint: string, data?: any, customHeaders: Record<string, string> = {}): Promise<T> => {
        return authHttpClient.request<T>("POST", endpoint, data, customHeaders);
    },

    // Sends PUT requests
    put: async <T>(endpoint: string, data?: any, customHeaders: Record<string, string> = {}): Promise<T> => {
        return authHttpClient.request<T>("PUT", endpoint, data, customHeaders);
    },

    // Sends DELETE requests
    delete: async <T>(endpoint: string, customHeaders: Record<string, string> = {}): Promise<T> => {
        return authHttpClient.request<T>("DELETE", endpoint, undefined, customHeaders);
    },

    // Shared request handler with token management
    request: async <T>(
        method: string,
        endpoint: string,
        data?: any,
        customHeaders: Record<string, string> = {}
    ): Promise<T> => {
        try {
            // Get the access token
            const accessToken = tokenStorage.getAccessToken();

            // Base headers
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...customHeaders,
            };

            // Attach the authorization token if present
            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }

            // Build and send the request
            const url = `${API_BASE_URL}${endpoint}`;
            const fetchOptions: RequestInit = {
                method,
                headers,
                body: data ? JSON.stringify(data) : undefined,
            };

            let response = await fetch(url, fetchOptions);

            // On 401, refresh through the shared single-flight manager (same one
            // api.ts uses) so concurrent 401s trigger ONE refresh, not many.
            if (response.status === 401) {
                const refreshed = await refreshAuthTokens();
                if (!refreshed) {
                    throw new Error('Authentication expired. Please login again.');
                }

                const newToken = tokenStorage.getAccessToken();
                if (newToken) {
                    headers['Authorization'] = `Bearer ${newToken}`;
                }
                // Retry the original request once with the refreshed token.
                response = await fetch(url, {
                    ...fetchOptions,
                    headers,
                });
            }

            // If the request still failed after the token refresh
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Request failed with status ${response.status}`);
            }

            // Parse and return the data
            const result = await response.json();
            return result as T;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },
};
