import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { api, apiState } from "./api";
import { sessionHint, tokenStorage, __resetAuthRefreshForTests } from "./auth-api";

// fetchAPI defaults to this when process.env.API_BASE_URL is unset (Node test env).
const API_BASE_URL = "http://localhost:8080";

const futureIso = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

// ADR 0013: the refresh endpoint reads the httpOnly cookie and returns only the
// access token in the body.
const refreshOk = () =>
    http.post(`${API_BASE_URL}/auth/refresh-token`, () =>
        HttpResponse.json({
            accessToken: { tokenValue: "new-token", expDate: futureIso() },
        }),
    );

const samplePayload = (suffix: string) => ({
    title: `Home-${suffix}`,
    fullAddress: `Street ${suffix}, City`,
    street: `Street ${suffix}`,
    city: "City",
    state: "",
    postalCode: "01001",
    country: "Ukraine",
    addressType: "HOME" as const,
    coordinates: { latitude: 50.45, longitude: 30.52 },
    isDefault: false,
});

describe("api.ts fetchAPI — reactive token refresh", () => {
    beforeEach(() => {
        // Module-level failure tracking / cache leak between tests.
        apiState.resetServiceState();
        localStorage.clear();
        __resetAuthRefreshForTests();
    });

    it("refreshes the access token and retries once when an authed request returns 401", async () => {
        sessionHint.set();
        tokenStorage.setAccessToken({ tokenValue: "expired-token", expDate: Date.now() + 1_000 });

        let postAttempts = 0;
        let retryAuthHeader: string | null = null;

        server.use(
            refreshOk(),
            http.post(`${API_BASE_URL}/addresses`, ({ request }) => {
                postAttempts += 1;
                if (postAttempts === 1) {
                    return new HttpResponse(null, { status: 401 });
                }
                retryAuthHeader = request.headers.get("authorization");
                return HttpResponse.json({
                    success: true,
                    data: { id: "addr-1", ...samplePayload("a") },
                });
            }),
        );

        const res = await api.addresses.create(samplePayload("a"));

        expect(res.success).toBe(true);
        expect(res.data.id).toBe("addr-1");
        expect(postAttempts).toBe(2); // original + one retry
        expect(retryAuthHeader).toBe("Bearer new-token"); // retry used the refreshed token
    });

    it("rejects on 401 when no session exists (no retry loop)", async () => {
        tokenStorage.setAccessToken({ tokenValue: "expired-token", expDate: Date.now() + 1_000 });
        // no session hint → refreshAuthTokens skips the network entirely

        let postAttempts = 0;
        server.use(
            http.post(`${API_BASE_URL}/addresses`, () => {
                postAttempts += 1;
                return new HttpResponse(null, { status: 401 });
            }),
        );

        await expect(api.addresses.create(samplePayload("b"))).rejects.toThrow();
        expect(postAttempts).toBe(1); // never retried — nothing to refresh with
    });
});
