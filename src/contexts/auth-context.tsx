"use client";

import {createContext, ReactNode, useContext, useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {LoginCredentials, RegisterCredentials, User} from "@/types/auth";
import {authApi, refreshAuthTokens, sessionHint, tokenStorage} from "@/lib/auth-api";
import {useToast} from "@/hooks/use-toast";
import {useLocale} from "./locale-context";
import {cartApi} from "@/lib/cart-api";
import {guestCartBuffer} from "@/lib/cart-guest-buffer";

async function replayGuestCartToServer(): Promise<void> {
    const entries = guestCartBuffer.read();
    if (entries.length === 0) return;
    const survivors: typeof entries = [];
    for (const entry of entries) {
        try {
            await cartApi.addItem({itemId: entry.itemId, quantity: entry.quantity});
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            // 4xx / business errors = item gone; drop it. Network errors = keep for retry.
            if (!/^HTTP 4\d\d|boxNotFound|invalid/i.test(message)) {
                survivors.push(entry);
            }
        }
    }
    if (survivors.length === 0) {
        guestCartBuffer.clear();
    } else {
        guestCartBuffer.clear();
        survivors.forEach((s) => guestCartBuffer.add(s));
    }
}

interface AuthUser {
    name?: string;
    email?: string;
    photoURL?: string;
}

interface AuthContextType {
    isLoading: boolean;
    isAuthenticated: boolean;
    user: AuthUser | null;
    login: (credentials: LoginCredentials) => Promise<void>;
    loginWithGoogle: (idToken: string) => Promise<void>;
    register: (userData: RegisterCredentials) => Promise<void>;
    logout: () => void;
    requireAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: Readonly<{ children: ReactNode }>) {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<AuthUser | null>(null);
    const router = useRouter();
    const {toast} = useToast();
    const {t} = useLocale();

    // Session recovery on page load. The access token lives only in memory
    // (ADR 0013), so every reload starts with a silent refresh through the
    // httpOnly cookie — but only when the session hint says a session existed:
    // anonymous visitors never hit /auth/refresh-token at all.
    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);
            try {
                if (sessionHint.present()) {
                    const ok = await refreshAuthTokens();
                    setUser(ok ? {} : null);
                }
            } catch (error) {
                console.error("Auth initialization failed:", error);
                tokenStorage.clear();
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    // When the shared refresh manager gives up (MAX_REFRESH_FAILURES), log out
    // cleanly instead of letting anything keep retrying.
    useEffect(() => {
        const onSessionExpired = () => {
            tokenStorage.clear();
            setUser(null);
            router.push("/login");
        };
        window.addEventListener("auth:session-expired", onSessionExpired);
        return () => window.removeEventListener("auth:session-expired", onSessionExpired);
    }, [router]);

    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        try {
            // authApi.login stores the access token in memory and arms the refresh timer
            await authApi.login(credentials);
            setUser({email: credentials.email});

            // Replay the guest cart to the server (fire-and-forget)
            void replayGuestCartToServer();

            router.push("/");
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = async (idToken: string) => {
        setIsLoading(true);
        try {
            await authApi.loginWithGoogle(idToken);
            setUser({});
            // Replay the guest cart to the server (fire-and-forget)
            void replayGuestCartToServer();
            router.push("/");
        } catch (error) {
            console.error("Google login failed:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (userData: RegisterCredentials) => {
        setIsLoading(true);
        try {
            await authApi.register(userData);
            setUser({name: userData.name, email: userData.email});

            // Replay the guest cart to the server (fire-and-forget)
            void replayGuestCartToServer();

            router.push("/");
        } catch (error) {
            console.error("Registration failed:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Logout: the server must revoke the refresh token and clear the httpOnly
    // cookie — it cannot be deleted locally. A network failure does not block
    // the UI logout (best-effort).
    const logout = () => {
        void authApi.logout().catch((error) => {
            console.error("Server-side logout failed (cookie/token may outlive UI logout):", error);
        });
        tokenStorage.clear();
        sessionHint.clear();
        setUser(null);
        toast({
            title: t("auth", "logout"),
            description: t("auth", "logoutSuccess"),
        });
        router.push("/");
    };

    // Auth check that redirects unauthenticated users to /login
    const requireAuth = () => {
        const hasToken = !!tokenStorage.getAccessToken();

        if (!isLoading && !hasToken) {

            router.push("/login");
            return false;
        }
        return true;
    };

    const contextValue = useMemo(() => ({
        isLoading,
        isAuthenticated: isLoading ? false : !!tokenStorage.getAccessToken(),
        user,
        login,
        loginWithGoogle,
        register,
        logout,
        requireAuth
    }), [isLoading, user, login, loginWithGoogle, register, logout, requireAuth]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
