import {Category, CategoryIcon, HeroImage, Order, ProfileDto, Store, StoreGroup, StoreSearchParams, StoreType, SurpriseBox} from "@/types";
import {Address, PaymentMethod, ReferralInfo} from "@/types/user";
import {ApiResponse} from "@/types/api";
import {LoginRequest, RegisterRequest} from "@/types/auth";
import { getCurrentLanguage } from '@/contexts/locale-context';
import { refreshAuthTokens, tokenStorage } from './auth-api';

// Base API URL
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

// profile-service contract (see fw-profile-service ProfileDto / ReferralDto).
type BackendProfileDto = {
    id: string;
    userId: string;
    name: string;
    email: string;
    avatar?: string;
    stats?: {
        boxesRescued?: number;
        moneySaved?: number;
        co2ReducedKg?: number;
    };
    referral?: {
        referralCode?: string;
        invitedCount?: number;
        pendingRewards?: number;
        totalEarned?: number;
    };
};

// Bridge backend shape (stats/referral) to the legacy UI shape (statistics/referralCode/...)
// to keep the profile UI rendering without a deeper refactor.
const mapBackendProfile = (p: BackendProfileDto): ProfileDto => ({
    id: p.id,
    name: p.name,
    email: p.email,
    avatar: p.avatar,
    statistics: p.stats
        ? {
            ordersCompleted: p.stats.boxesRescued ?? 0,
            itemsSaved: p.stats.boxesRescued ?? 0,
            savings: Number(p.stats.moneySaved ?? 0),
            co2ReducedKg: Number(p.stats.co2ReducedKg ?? 0),
        }
        : undefined,
    referralCode: p.referral?.referralCode,
    referralStats: p.referral
        ? {
            invitedCount: p.referral.invitedCount ?? 0,
            pendingRewards: p.referral.pendingRewards ?? 0,
            totalEarned: p.referral.totalEarned ?? 0,
        }
        : undefined,
});

// Backend StoreDto exposes `imageUrl` / `heroImageUrl` / `location.{latitude,longitude}`;
// frontend StoreSummary/StoreDetail expects `logoUrl` / `heroUrl` / `coordinates.{lat,lng}`.
// Map at the API boundary so callers stay typed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStoreImageFields = (s: any): any => {
    if (!s || typeof s !== 'object') return s;
    const loc = s.location && typeof s.location === 'object' ? s.location : undefined;
    return {
        ...s,
        logoUrl: s.logoUrl ?? s.imageUrl ?? "",
        heroUrl: s.heroUrl ?? s.heroImageUrl ?? s.imageUrl ?? "",
        isOpen: s.isOpen ?? s.currentlyOpen ?? false,
        coordinates: s.coordinates ?? (loc ? {
            lat: loc.latitude ?? loc.lat,
            lng: loc.longitude ?? loc.lng,
        } : { lat: undefined, lng: undefined }),
    };
};

// Build query string for /stores per Phase 2 contract.
// See docs/contracts/stores-api.md §3.
function buildStoresQuery(params: StoreSearchParams): string {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.type) qs.set("type", params.type);
    if (params.group) qs.set("group", params.group);
    if (params.categoryId) qs.set("categoryId", params.categoryId);
    if (params.categorySlug) qs.set("categorySlug", params.categorySlug);
    if (params.latitude !== undefined) qs.set("latitude", String(params.latitude));
    if (params.longitude !== undefined) qs.set("longitude", String(params.longitude));
    if (params.minRating !== undefined) qs.set("minRating", String(params.minRating));
    if (params.maxDistance !== undefined) qs.set("maxDistance", String(params.maxDistance));
    if (params.openNow !== undefined) qs.set("openNow", String(params.openNow));
    if (params.sort) qs.set("sort", params.sort);
    if (params.page !== undefined) qs.set("page", String(params.page));
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    // Multi-value: ?priceLevel=1&priceLevel=2 (NOT comma-separated)
    (params.priceLevel ?? []).forEach(level => qs.append("priceLevel", String(level)));
    return qs.toString();
}

export interface StoresSearchResult {
    items: Store[];
    totalElements: number;
    totalPages: number;
    page: number;
}

// HTTP QUERY body for /stores — mirrors fw-store-service StoreSearchQuery.
// The geo filter travels as a nested object instead of the flat
// ?latitude=..&longitude=..&maxDistance=.. tail a query string forces.
function buildStoresQueryBody(params: StoreSearchParams): Record<string, unknown> {
    const within = params.latitude !== undefined && params.longitude !== undefined
        ? { lat: params.latitude, lng: params.longitude, radiusKm: params.maxDistance }
        : undefined;
    return {
        search: params.search,
        type: params.type,
        group: params.group,
        categoryId: params.categoryId,
        categorySlug: params.categorySlug,
        minRating: params.minRating,
        priceLevels: params.priceLevel,
        openNow: params.openNow,
        within,
        sort: params.sort,
        page: params.page,
        size: params.limit,
    };
}

// Shared page → StoresSearchResult mapping for both the GET and the QUERY variant.
const toStoresSearchResult = (data?: {
    content?: Store[];
    totalElements?: number;
    totalPages?: number;
    number?: number;
}): StoresSearchResult => ({
    items: (data?.content ?? []).map(mapStoreImageFields) as Store[],
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    page: data?.number ?? 0,
});

// Backend SurpriseBoxDto: title/imageUrl/discountPercentage/location.{lat,lng}/store.{storeId,name}.
// Frontend SurpriseBox: name/image/discount/location.{latitude,longitude}/storeId/storeName.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSurpriseBoxFields = (b: any): any => {
    if (!b || typeof b !== 'object') return b;
    const loc = b.location && typeof b.location === 'object' ? b.location : undefined;
    return {
        ...b,
        name: b.name ?? b.title ?? "",
        image: b.image ?? b.imageUrl ?? "",
        discount: b.discount ?? b.discountPercentage ?? 0,
        location: loc ? {
            latitude: loc.latitude ?? loc.lat,
            longitude: loc.longitude ?? loc.lng,
        } : undefined,
        storeId: b.storeId ?? b.store?.storeId,
        storeName: b.storeName ?? b.store?.name,
    };
};

// Simulated network delay (demo purposes)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Track failed requests to prevent infinite retries
const failedRequests = new Map<string, {
    timestamp: number;
    count: number;
}>();

// Global error state tracking
export const apiState = {
    serviceUnavailable: false,
    resetServiceState: () => {
        apiState.serviceUnavailable = false;
        globalFailureCount = 0;
        // Clear failed requests that might be causing issues
        failedRequests.clear();
    }
};

// Time window for tracking repeated failures (1 hour in ms)
const FAILURE_TRACKING_WINDOW = 30 * 60 * 1000; // Reduced to 30 minutes
// Maximum allowed initial attempts
const MAX_INITIAL_ATTEMPTS = 2;
// Maximum total failures before declaring service unavailable
const MAX_TOTAL_FAILURES = 5;
// Debounce time between similar requests (ms)
const REQUEST_DEBOUNCE_TIME = 1000;

// Cache to store responses for a short time
const responseCache = new Map<string, {
    data: any;
    timestamp: number;
}>();

// Cache expiration time in ms (30 seconds)
const CACHE_EXPIRY_TIME = 5000;

// Track pending requests to avoid duplicate in-flight requests
const pendingRequests = new Map<string, Promise<any>>();

// Global failure counter across endpoints
let globalFailureCount = 0;

// Performs an API request
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // For testing/debug: reset service unavailability flag if it was set
    if (apiState.serviceUnavailable) {
        apiState.resetServiceState();
    }

    // Create a unique key for this request
    const requestKey = `${endpoint}${options.method || 'GET'}${options.body ? JSON.stringify(options.body) : ''}`;

    const now = Date.now();

    // Check if we have a cached response that's still valid
    const cachedResponse = responseCache.get(requestKey);
    if (cachedResponse && now - cachedResponse.timestamp < CACHE_EXPIRY_TIME) {
        return cachedResponse.data as T;
    }

    // Check if there's already a pending request for this exact resource
    if (pendingRequests.has(requestKey)) {
        return pendingRequests.get(requestKey) as Promise<T>;
    }

    // Check if this request has failed recently
    const failureRecord = failedRequests.get(requestKey);

    if (failureRecord) {
        // If it's been more than the tracking window, reset the count
        if (now - failureRecord.timestamp > FAILURE_TRACKING_WINDOW) {
            failedRequests.delete(requestKey);
        }
        // If we've exceeded the maximum initial attempts, throw an error
        else if (failureRecord.count > MAX_INITIAL_ATTEMPTS) {
            console.warn(`Request to ${endpoint} has failed multiple times. Please try again later.`);
            throw new Error('Too many failed attempts. Please reload the page to try again.');
        }
    }

    // If global failure count is too high, mark service as unavailable
    if (globalFailureCount >= MAX_TOTAL_FAILURES) {
        apiState.serviceUnavailable = true;
        throw new Error('API_SERVICE_UNAVAILABLE');
    }

    // Create the actual request promise
    const fetchPromise = (async () => {
        try {
            // Prepend the base URL to the request path
            const url = `${API_BASE_URL}${endpoint}`;

            // Default headers
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept-Language': getCurrentLanguage(),
                ...(options.headers as Record<string, string>),
            };

            // Check if endpoint requires authentication
            // Home endpoints don't require authorization
            const requiresAuth = !endpoint.startsWith('/home/');

            // Attach the auth token when present and the endpoint requires auth.
            // The token lives in memory only (ADR 0013) — localStorage is not used.
            if (requiresAuth && typeof window !== 'undefined') {
                const token = tokenStorage.getAccessToken();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            }

            // Run the request with a timeout (fresh AbortController per attempt)
            const fetchWithTimeout = async (): Promise<Response> => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
                try {
                    return await fetch(url, {...options, headers, signal: controller.signal});
                } finally {
                    clearTimeout(timeoutId);
                }
            };

            let response;
            let data;

            try {
                response = await fetchWithTimeout();

                // Reactive token refresh: an authed request rejected with 401 usually
                // means the access token expired. Refresh once (single-flight) and retry.
                // Endpoints routed through this client (addresses, orders, profile, …)
                // otherwise have no recovery path — unlike authHttpClient.
                if (response.status === 401 && requiresAuth && typeof window !== 'undefined') {
                    const refreshed = await refreshAuthTokens();
                    if (refreshed) {
                        const newToken = tokenStorage.getAccessToken();
                        if (newToken) {
                            headers['Authorization'] = `Bearer ${newToken}`;
                        }
                        response = await fetchWithTimeout();
                    }
                }

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                data = await response.json();

            } catch (error) {
                const fetchError = error as Error;
                if (fetchError.name === 'AbortError') {
                    throw new Error('Request timeout');
                }
                // Network errors (Failed to fetch) — don't spam console
                if (fetchError.message === 'Failed to fetch' || fetchError.message === 'Load failed') {
                    throw new Error('API_NETWORK_ERROR');
                }
                throw fetchError;
            }

            // Request succeeded, remove from failed requests if it was there
            failedRequests.delete(requestKey);

            // Reset/decrement global failure count after successful requests
            if (globalFailureCount > 0) {
                globalFailureCount = Math.max(0, globalFailureCount - 1);
            }

            // Reduce artificial delay to minimize CPU usage
            await delay(200);

            // Cache the successful response
            responseCache.set(requestKey, {
                data,
                timestamp: Date.now()
            });

            return data as T;
        } catch (error) {
            const err = error as Error;
            const isNetworkError = err.message === 'API_NETWORK_ERROR' || err.message === 'Request timeout';

            // Only warn once per endpoint for network errors, don't flood the console
            if (isNetworkError) {
                if (!failedRequests.has(requestKey)) {
                    console.warn(`[FoodWise] API unavailable: ${endpoint}`);
                }
            } else {
                console.warn(`[FoodWise] API error: ${endpoint}`, err.message);
            }

            // Record the failure
            const existingRecord = failedRequests.get(requestKey);
            failedRequests.set(requestKey, {
                timestamp: now,
                count: existingRecord ? existingRecord.count + 1 : 1
            });

            // Increment global failure counter
            globalFailureCount++;

            // If we have too many failures globally, mark service as unavailable
            if (globalFailureCount >= MAX_TOTAL_FAILURES) {
                apiState.serviceUnavailable = true;
                throw new Error('API_SERVICE_UNAVAILABLE');
            }

            throw error;
        } finally {
            // Remove this request from pending requests
            pendingRequests.delete(requestKey);
        }
    })();

    // Store the promise in pending requests
    pendingRequests.set(requestKey, fetchPromise);

    // Return the promise
    return fetchPromise;
}

// API endpoints
export const api = {
    // Surprise Boxes
    boxes: {
        getAll: (userLat?: number, userLng?: number, radius: number = 5) => fetchAPI<ApiResponse<SurpriseBox[]>>(
            userLat && userLng
                ? `/home/boxes?lat=${userLat}&lng=${userLng}&radius=${radius}`
                : '/home/boxes')
            .then(response => (response.data || []).map(mapSurpriseBoxFields)),
        getById: (id: string) => fetchAPI<ApiResponse<SurpriseBox>>(`/surprise-boxes/${id}`)
            .then(response => mapSurpriseBoxFields(response.data)),
        getByStore: (storeId: string) => fetchAPI<ApiResponse<SurpriseBox[]>>(`/surprise-boxes/store/${storeId}`)
            .then(response => (response.data || []).map(mapSurpriseBoxFields)),
        getRecommended: (storeId: string) => fetchAPI<ApiResponse<SurpriseBox[]>>(`/surprise-boxes/store/${storeId}`)
            .then(response => (response.data || [])
                .filter((b: SurpriseBox & { recommended?: boolean }) => b.recommended === true)
                .map(mapSurpriseBoxFields)),
    },

    // Stores/Restaurants
    stores: {
        getAll: (userLat?: number, userLng?: number) => fetchAPI<ApiResponse<Store[] | { content: Store[] }>>(
            userLat && userLng
                ? `/stores?lat=${userLat}&lng=${userLng}`
                : '/stores'
        ).then(response => {
            const data = response.data;
            const items: Store[] = Array.isArray(data) ? data : (data?.content ?? []);
            return items.map(mapStoreImageFields);
        }),
        getById: (id: string, userLat?: number, userLng?: number) => fetchAPI<ApiResponse<Store>>(
            userLat && userLng
                ? `/stores/${id}?lat=${userLat}&lng=${userLng}`
                : `/stores/${id}`
        ).then(response => response.data ? mapStoreImageFields(response.data) : response.data),
        getNearby: (lat: number, lng: number, radius: number = 5) =>
            fetchAPI<ApiResponse<Store[]>>(`/home/stores/nearby?lat=${lat}&lng=${lng}&radius=${radius}`)
                .then(response => (response.data || []).map(mapStoreImageFields)),
        getFeatured: (userLat?: number, userLng?: number) => fetchAPI<ApiResponse<Store[]>>(
            userLat && userLng
                ? `/home/featured-stores?lat=${userLat}&lng=${userLng}`
                : `/home/featured-stores`
        ).then(response => (response.data || []).map(mapStoreImageFields)),
        // Full search per Phase 2 contract (docs/contracts/stores-api.md §3).
        // Returns items + pagination metadata.
        search: (params: StoreSearchParams): Promise<StoresSearchResult> => {
            const qs = buildStoresQuery(params);
            const url = qs ? `/stores?${qs}` : "/stores";
            return fetchAPI<ApiResponse<{
                content: Store[];
                totalPages: number;
                totalElements: number;
                empty: boolean;
                number: number;
            }>>(url).then(response => toStoresSearchResult(response.data));
        },
        // Same search as `search`, but over the HTTP QUERY method: filters travel
        // in a JSON body (safe + idempotent, like GET) instead of a query string.
        // Backend route: fw-store-service StoreQueryRouterConfig.
        searchViaQuery: (params: StoreSearchParams): Promise<StoresSearchResult> => {
            return fetchAPI<ApiResponse<{
                content: Store[];
                totalPages: number;
                totalElements: number;
                empty: boolean;
                number: number;
            }>>("/stores", {
                method: "QUERY",
                body: JSON.stringify(buildStoresQueryBody(params)),
            }).then(response => toStoresSearchResult(response.data));
        },
        // Convenience wrapper for category pages — returns just items.
        getByCategory: (categorySlug: string, params?: Omit<StoreSearchParams, "categorySlug">): Promise<Store[]> => {
            return api.stores.search({ ...(params ?? {}), categorySlug }).then(r => r.items);
        },
    },

    // Hero Images for Carousel
    heroImages: {
        getAll: () => fetchAPI<ApiResponse<HeroImage[]>>('/home/hero-images')
            .then(response => response.data || []),
    },

    // Category Icons
    categoryIcons: {
        getAll: () => fetchAPI<ApiResponse<CategoryIcon[]>>('/home/category-icons')
            .then(response => response.data || []),
    },

    // Categories
    categories: {
        getAll: (opts?: { group?: StoreGroup; types?: StoreType[] }) => {
            const qs = new URLSearchParams();
            if (opts?.group) qs.set('group', opts.group);
            (opts?.types ?? []).forEach(t => qs.append('type', t));
            const suffix = qs.toString() ? `?${qs.toString()}` : '';
            return fetchAPI<ApiResponse<Category[]>>(`/home/categories${suffix}`)
                .then(response => response.data || []);
        },
        getBySlug: (slug: string) => fetchAPI<ApiResponse<Category>>(`/categories/${slug}`)
            .then(response => response.data ?? null),
    },

    // Orders
    orders: {
        getAll: (page: number = 0, size: number = 20) =>
            fetchAPI<{
                success: boolean;
                data: {
                    orders: Order[];
                    page: number;
                    size: number;
                    totalElements: number;
                    totalPages: number;
                }
            }>(`/orders?page=${page}&size=${size}`),
        getById: (id: string) =>
            fetchAPI<ApiResponse<Order>>(`/orders/${id}`),
        create: (orderData: { storeId: string, items: { surpriseBoxId: string, deliveryAddress: string, deliveryType: string, paymentType: string, name: string, price: import('@/types').Money, quantity: number }[] }) =>
            fetchAPI<ApiResponse<import('@/types').CreateOrderResponse>>('/orders', {
                method: 'POST',
                body: JSON.stringify(orderData),
            }),
        cancel: (id: string) =>
            fetchAPI<ApiResponse<Order>>(`/orders/${id}/cancel`, {
                method: 'PATCH',
            }),
        orderAgain: (storeId: string) =>
            fetchAPI<ApiResponse<Order>>(`/orders/stores/${storeId}/order-again`),
    },

    // User profile — backend lives at /profiles/me (profile-service via gateway).
    user: {
        getProfile: () =>
            fetchAPI<ApiResponse<BackendProfileDto>>('/profiles/me')
                .then(response => response.data ? mapBackendProfile(response.data) : null),
        updateProfile: (profileData: Partial<ProfileDto>) =>
            fetchAPI<ApiResponse<BackendProfileDto>>('/profiles/me', {
                method: 'PUT',
                body: JSON.stringify({name: profileData.name}),
            })
                .then(response => response.data ? mapBackendProfile(response.data) : null),
        getReferralInfo: () =>
            fetchAPI<ApiResponse<BackendProfileDto>>('/profiles/me')
                .then(response => {
                    if (!response.data) return null;
                    const code = response.data.referral?.referralCode ?? '';
                    return {
                        code,
                        referralCode: code,
                        invitedCount: response.data.referral?.invitedCount ?? 0,
                        pendingRewards: response.data.referral?.pendingRewards ?? 0,
                        totalEarned: response.data.referral?.totalEarned ?? 0,
                    } as ReferralInfo;
                }),
        uploadAvatar: async (file: File): Promise<ApiResponse<{ avatarUrl: string }>> => {
            const url = `${API_BASE_URL}/profiles/me/avatar`;
            const formData = new FormData();
            formData.append('file', file);

            // Get auth token
            const token = localStorage.getItem('accessToken');
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Add request for signed URL and direct upload to GCS if needed
            // This approach uses server-side upload handling
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                headers,
                // Add credentials to enable cookies if needed for session auth
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        },
    },

    // Addresses - Updated according to the API contract
    addresses: {
        getAll: () =>
            fetchAPI<ApiResponse<Address[]>>('/addresses'),
        create: (address: Omit<Address, 'id'>) =>
            fetchAPI<ApiResponse<Address>>('/addresses', {
                method: 'POST',
                body: JSON.stringify(address),
            }),
        update: (address: Address) => fetchAPI<ApiResponse<Address>>(`/addresses`, {
            method: 'PATCH',
            body: JSON.stringify(address),
        }),
        setDefault: (id: string) =>
            fetchAPI<ApiResponse<Address>>(`/addresses/${id}/default`, {
                method: 'PATCH',
            }),
        delete: (id: string) =>
            fetchAPI<ApiResponse<null>>(`/addresses/${id}`, {
                method: 'DELETE',
            }),
    },

    // Payment methods
    paymentMethods: {
        getAll: () =>
            fetchAPI<ApiResponse<PaymentMethod[]>>('/payment-methods'),
        create: (paymentMethod: Omit<PaymentMethod, 'id'>) =>
            fetchAPI<ApiResponse<PaymentMethod>>('/payment-methods', {
                method: 'POST',
                body: JSON.stringify(paymentMethod),
            }),
        setDefault: (id: string) =>
            fetchAPI<ApiResponse<PaymentMethod>>(`/payment-methods/${id}/default`, {
                method: 'PATCH',
            }),
        delete: (id: string) =>
            fetchAPI<ApiResponse<void>>(`/payment-methods/${id}`, {
                method: 'DELETE',
            }),
    },

    // Authentication (handle in AuthProvider)
    auth: {
        login: (credentials: LoginRequest) =>
            fetchAPI<ApiResponse<{ token: string }>>('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials),
            }),
        register: (userData: RegisterRequest) =>
            fetchAPI<ApiResponse<{ token: string }>>('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData),
            }),
        refreshToken: (refreshToken: string) =>
            fetchAPI<ApiResponse<{ token: string }>>('/auth/refresh-token', {
                method: 'POST',
                body: JSON.stringify({refreshToken}),
            }),
    },
};

// Mock data has been removed as the application now uses real API data
// If you need to fallback to mock data, uncomment the section below
/*
export const mockData = {
    categories: [
        {id: "1", name: "Bakery", icon: "croissant"},
        {id: "2", name: "Cafe", icon: "coffee"},
        {id: "3", name: "Restaurant", icon: "utensils"},
        {id: "4", name: "Grocery", icon: "shopping-cart"},
        {id: "5", name: "Sweets", icon: "candy"},
        {id: "6", name: "Other", icon: "leaf"},
    ],

    boxes: [
        {
            id: "1",
            name: "Bakery Box",
            description: "A surprise box with fresh pastries and bread",
            image: "https://picsum.photos/600/400",
            originalPrice: 30,
            discountedPrice: 21,
            discount: 30,
            timeLeft: "2h 30m",
            quantity: 5,
            storeId: "1",
            storeName: "Local Bakery",
            storeImage: "https://picsum.photos/100/100",
            category: "Bakery",
            location: {latitude: 34.0522, longitude: -118.2437},
        },
        {
            id: "2",
            name: "Cafe Treats",
            description: "Delicious coffee shop treats and pastries",
            image: "https://picsum.photos/600/400",
            originalPrice: 25,
            discountedPrice: 12.5,
            discount: 50,
            timeLeft: "1h 15m",
            quantity: 3,
            storeId: "2",
            storeName: "Coffee Corner",
            storeImage: "https://picsum.photos/100/100",
            category: "Cafe",
            location: {latitude: 40.7128, longitude: -74.006},
        },
        {
            id: "3",
            name: "Restaurant Leftovers",
            description: "Gourmet meals at a fraction of the price",
            image: "https://picsum.photos/600/400",
            originalPrice: 50,
            discountedPrice: 30,
            discount: 40,
            timeLeft: "3h 00m",
            quantity: 2,
            storeId: "3",
            storeName: "Gourmet Bistro",
            storeImage: "https://picsum.photos/100/100",
            category: "Restaurant",
            location: {latitude: 51.5074, longitude: 0.1278},
        },
    ],

    stores: [
        {
            id: "1",
            name: "Local Bakery",
            description: "Fresh bread and pastries daily",
            imageUrl: "https://picsum.photos/600/400",
            category: "Bakery",
            address: "123 Baker Street, Los Angeles",
            coordinates: {latitude: 34.0522, longitude: -118.2437},
            rating: 4.5,
        },
        {
            id: "2",
            name: "Coffee Corner",
            description: "Specialty coffee and treats",
            imageUrl: "https://picsum.photos/600/400",
            category: "Cafe",
            address: "456 Coffee Lane, New York",
            coordinates: {latitude: 40.7128, longitude: -74.006},
            rating: 4.2,
        },
        {
            id: "3",
            name: "Gourmet Bistro",
            description: "Fine dining at affordable prices",
            imageUrl: "https://picsum.photos/600/400",
            category: "Restaurant",
            address: "789 Gourmet Ave, London",
            coordinates: {latitude: 51.5074, longitude: 0.1278},
            rating: 4.8,
        },
    ],
};
*/
