import {
    AuthResponse,
    LoginCredentials,
    RefreshTokenResponse,
    RegisterCredentials,
} from "@/types/auth";

interface StoredToken {
  tokenValue: string;
  expDate: number;
}

// ADR 0013: the access token lives ONLY in this module-level memory — never in
// localStorage/sessionStorage, where any XSS payload could exfiltrate it. The
// refresh token is an httpOnly cookie the browser attaches to /auth/* requests
// by itself; JS never sees its value. A page reload therefore starts with an
// empty authState and recovers the session via one silent /auth/refresh-token.
const authState: { access: StoredToken | null } = {
  access: null,
};

const REFRESH_MARGIN = 60_000; // milliseconds before expiry to refresh
// Floor on the proactive timer: a refresh is NEVER scheduled synchronously /
// with zero delay, even for an already-expired access token. This is what stops
// a short-TTL token from turning scheduleRefresh into a tight loop.
export const MIN_REFRESH_DELAY = 5_000;
// Circuit breaker: after this many CONSECUTIVE failed refreshes we stop trying
// entirely (instead of hammering the backend into 429s) until a fresh login or a
// successful refresh resets the counter.
export const MAX_REFRESH_FAILURES = 3;

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let refreshFailureCount = 0;

// Helper to check if code is running in browser environment
const isBrowser = (): boolean => typeof window !== 'undefined';

// The refresh cookie is invisible to JS, so this non-secret flag is the only
// way to know "a session probably exists" without firing a network request.
// It gates the bootstrap silent refresh — anonymous visitors never hit
// /auth/refresh-token on page load. It contains no token material.
const SESSION_HINT_KEY = 'fw.auth.session-hint';

export const sessionHint = {
  set: (): void => {
    if (isBrowser()) localStorage.setItem(SESSION_HINT_KEY, '1');
  },
  clear: (): void => {
    if (isBrowser()) localStorage.removeItem(SESSION_HINT_KEY);
  },
  present: (): boolean => isBrowser() && localStorage.getItem(SESSION_HINT_KEY) === '1',
};

// One-time purge of the pre-ADR-0013 localStorage keys so tokens persisted by
// older builds don't keep sitting in storage after the upgrade.
if (isBrowser()) {
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  } catch {
    // storage unavailable (private mode quota etc.) — nothing to purge then
  }
}

// In-memory access-token holder shared by all API clients. Keeps the historical
// name so call sites read the same; "storage" is now process memory only.
export const tokenStorage = {
  setAccessToken: (token: StoredToken): void => {
    authState.access = token;
  },

  getAccessToken: (): string | null => authState.access?.tokenValue ?? null,

  clear: (): void => {
    authState.access = null;
  },
};

function saveAuthTokens(resp: AuthResponse): void {
  authState.access = {
    tokenValue: resp.accessToken.tokenValue,
    expDate: Date.parse(resp.accessToken.expDate),
  };
  sessionHint.set();
}

// Single source of truth for "a fresh session arrived": store the access token,
// reset the failure breaker, and (re)arm EXACTLY ONE proactive timer.
function applyAuthSession(resp: AuthResponse): void {
  saveAuthTokens(resp);
  refreshFailureCount = 0;
  armRefresh();
}

// Clears every trace of the session — in-memory access token, the session hint,
// and the proactive timer — so no stale state keeps firing refreshes. The
// httpOnly cookie itself can only be cleared by the server (logout endpoint).
function clearSession(): void {
  tokenStorage.clear();
  sessionHint.clear();
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

// Arms a SINGLE proactive refresh. Cancels any previously scheduled timer first
// (no accumulation) and always honours MIN_REFRESH_DELAY (never synchronous).
export function armRefresh(): void {
  if (refreshTimer) clearTimeout(refreshTimer);
  let delay = MIN_REFRESH_DELAY;
  if (authState.access) {
    delay = Math.max(MIN_REFRESH_DELAY, authState.access.expDate - Date.now() - REFRESH_MARGIN);
  }
  refreshTimer = setTimeout(() => { void refreshAuthTokens(); }, delay);
}

// Test-only: reset all module-level refresh state between cases.
export function __resetAuthRefreshForTests(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  refreshFailureCount = 0;
  authState.access = null;
  inFlightRefresh = null;
}

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

// Performs an API request with error handling
async function fetchAPI<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    try {
        const url = `${API_BASE_URL}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // Use appropriate fetch method based on environment
        let response;
        if (isBrowser()) {
            // In browser, use the regular fetch API but handle CSP errors
            try {
                response = await fetch(url, {
                    ...options,
                    headers,
                    // Attaches the httpOnly refresh cookie on /auth/* calls.
                    credentials: 'include',
                });
            } catch (fetchError) {
                // Handle CSP violations or network errors
                if (fetchError instanceof TypeError &&
                    fetchError.message.includes("Failed to fetch") &&
                    (fetchError.message.includes("Content Security Policy") ||
                        fetchError.stack?.includes("Content Security Policy"))) {
                    throw new Error(`CSP blocked request to ${url}. Please check your Content Security Policy settings.`);
                }
                throw fetchError;
            }
        } else {
            // In server-side context
            response = await fetch(url, {
                ...options,
                headers,
            });
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const err = new Error(errorData.message ?? `API error: ${response.status}`) as Error & { status?: number };
            err.status = response.status;
            throw err;
        }

        // 204 No Content (logout) has no body to parse
        if (response.status === 204) {
            return undefined as T;
        }

        const data = await response.json();
        return data as T;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Authentication API
export const authApi = {
    // Email/password login
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        return fetchAPI<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        }).then(resp => {
          applyAuthSession(resp);
          return resp;
        });
    },

    // Login with a Google ID token
    loginWithGoogle: async (idToken: string): Promise<AuthResponse> => {
        return fetchAPI<AuthResponse>('/auth/google', {
            method: 'POST',
            body: JSON.stringify({idToken}),
        }).then(resp => {
          applyAuthSession(resp);
          return resp;
        });
    },

    // User registration
    register: async (userData: RegisterCredentials): Promise<AuthResponse> => {
        return fetchAPI<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        }).then(resp => {
          applyAuthSession(resp);
          return resp;
        });
    },

    // Token refresh. No body needed: the refresh token arrives as an httpOnly cookie.
    // Persisting tokens + re-arming the schedule is the caller's job
    // (refreshAuthTokens → applyAuthSession), so there is exactly one place that
    // owns session state.
    refreshToken: async (): Promise<RefreshTokenResponse> => {
        return fetchAPI<RefreshTokenResponse>('/auth/refresh-token', {
            method: 'POST',
        });
    },

    // Logout: the server revokes the refresh token and clears the cookie (Max-Age=0)
    logout: async (): Promise<void> => {
        await fetchAPI<void>('/auth/logout', {
            method: 'POST',
        });
    },
};

// Single-flight reactive refresh shared by the API clients. Concurrent 401s must
// trigger only ONE /auth/refresh-token call: the backend rotates the refresh
// token, so parallel refreshes would invalidate each other and drop the session.
// Resolves true when the access token was refreshed, false when there is nothing
// to refresh with (logged out / refresh failed → session cleared).
let inFlightRefresh: Promise<boolean> | null = null;

export function refreshAuthTokens(): Promise<boolean> {
    // Circuit breaker: once we've failed MAX_REFRESH_FAILURES times in a row,
    // stop hitting the backend until a fresh login/refresh resets the counter.
    // This is the hard stop against the 429 storm.
    if (refreshFailureCount >= MAX_REFRESH_FAILURES) return Promise.resolve(false);
    if (inFlightRefresh) return inFlightRefresh;

    const refresh = (async (): Promise<boolean> => {
        if (!isBrowser()) return false;
        // No hint = no session was ever established here → skip the network
        // round-trip instead of collecting a guaranteed 401.
        if (!sessionHint.present()) return false;
        // Captured BEFORE clearing: a failed MID-SESSION refresh must announce
        // expiry (redirect to /login), but a failed BOOTSTRAP refresh (no access
        // token yet, e.g. stale hint after the cookie expired) must stay silent
        // so anonymous visitors aren't bounced to the login page.
        const hadActiveSession = authState.access !== null;
        try {
            const resp = await authApi.refreshToken();
            // One place owns session state: persist, reset breaker, re-arm timer.
            applyAuthSession(resp);
            return true;
        } catch (error) {
            const status = (error as { status?: number }).status;
            // 401/403 = the refresh cookie itself is rejected → fatal, log out now.
            // 429 / 5xx / network = transient → count toward the breaker but keep
            // the session so a later request can retry, until the breaker trips.
            const fatal = status === 401 || status === 403;
            refreshFailureCount = fatal ? MAX_REFRESH_FAILURES : refreshFailureCount + 1;
            console.error('Token refresh failed:', error);
            if (fatal || refreshFailureCount >= MAX_REFRESH_FAILURES) {
                clearSession();
                if (hadActiveSession) {
                    // Give up cleanly and let the app log out / redirect instead of looping.
                    window.dispatchEvent(new CustomEvent('auth:session-expired'));
                }
            }
            return false;
        }
    })().finally(() => {
        if (inFlightRefresh === refresh) inFlightRefresh = null;
    });

    inFlightRefresh = refresh;
    return refresh;
}
