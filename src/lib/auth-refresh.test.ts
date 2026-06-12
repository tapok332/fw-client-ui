import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {
    armRefresh,
    MAX_REFRESH_FAILURES,
    MIN_REFRESH_DELAY,
    refreshAuthTokens,
    sessionHint,
    tokenStorage,
    __resetAuthRefreshForTests,
} from "./auth-api";

const future = () => new Date(Date.now() + 15 * 60_000).toISOString();

// ADR 0013: the refresh token is an httpOnly cookie the browser attaches by
// itself, so a successful refresh response carries ONLY the access token.
function okRefresh() {
    return {
        ok: true,
        status: 200,
        json: async () => ({
            accessToken: {tokenValue: "new-access", expDate: future()},
        }),
    } as Response;
}

function errorRefresh(status: number) {
    return {
        ok: false,
        status,
        json: async () => ({message: `error ${status}`}),
        text: async () => `error ${status}`,
        headers: new Headers(),
    } as unknown as Response;
}

function seedActiveSession() {
    sessionHint.set();
    tokenStorage.setAccessToken({tokenValue: "stale-access", expDate: Date.now() + 1_000});
}

beforeEach(() => {
    localStorage.clear();
    __resetAuthRefreshForTests();
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe("refreshAuthTokens — single-flight", () => {
    it("collapses concurrent calls into ONE network refresh", async () => {
        seedActiveSession();
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(okRefresh());

        const [a, b, c] = await Promise.all([
            refreshAuthTokens(),
            refreshAuthTokens(),
            refreshAuthTokens(),
        ]);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect([a, b, c]).toEqual([true, true, true]);
        expect(tokenStorage.getAccessToken()).toBe("new-access");
    });

    it("sends NO body and includes credentials so the httpOnly cookie travels", async () => {
        seedActiveSession();
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(okRefresh());

        await refreshAuthTokens();

        const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
        expect(url).toContain("/auth/refresh-token");
        expect(options.body).toBeUndefined();
        expect(options.credentials).toBe("include");
    });

    it("returns false and makes NO request when no session hint is present", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(okRefresh());

        expect(await refreshAuthTokens()).toBe(false);
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});

describe("refreshAuthTokens — failure clears the session", () => {
    it("clears the in-memory token and the hint on 401", async () => {
        seedActiveSession();
        vi.spyOn(globalThis, "fetch").mockResolvedValue(errorRefresh(401));

        expect(await refreshAuthTokens()).toBe(false);
        expect(tokenStorage.getAccessToken()).toBeNull();
        expect(sessionHint.present()).toBe(false);
    });

    it("dispatches auth:session-expired only for a MID-SESSION fatal failure", async () => {
        seedActiveSession();
        vi.spyOn(globalThis, "fetch").mockResolvedValue(errorRefresh(401));
        const expired = vi.fn();
        window.addEventListener("auth:session-expired", expired);

        await refreshAuthTokens();

        expect(expired).toHaveBeenCalledTimes(1);
        window.removeEventListener("auth:session-expired", expired);
    });

    it("stays SILENT when a bootstrap refresh fails (stale hint, no access token)", async () => {
        sessionHint.set(); // hint without an in-memory access token = bootstrap
        vi.spyOn(globalThis, "fetch").mockResolvedValue(errorRefresh(401));
        const expired = vi.fn();
        window.addEventListener("auth:session-expired", expired);

        expect(await refreshAuthTokens()).toBe(false);
        // The stale hint is cleaned up, but anonymous visitors are NOT redirected.
        expect(expired).not.toHaveBeenCalled();
        expect(sessionHint.present()).toBe(false);
        window.removeEventListener("auth:session-expired", expired);
    });

    it("stops refreshing after MAX_REFRESH_FAILURES consecutive failures", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(errorRefresh(429));

        // Re-seed the session before each attempt so the only thing stopping
        // the loop is the failure cap, not a cleared session.
        for (let i = 0; i < MAX_REFRESH_FAILURES + 3; i++) {
            seedActiveSession();
            await refreshAuthTokens();
        }

        expect(fetchSpy.mock.calls.length).toBeLessThanOrEqual(MAX_REFRESH_FAILURES);
    });
});

describe("armRefresh — no timer accumulation", () => {
    it("keeps a single proactive timer no matter how many times it is armed", async () => {
        vi.useFakeTimers();
        seedActiveSession();
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(okRefresh());

        // Arm three times in a row — the earlier timers must be cancelled.
        armRefresh();
        armRefresh();
        armRefresh();

        // Advance just past the first scheduled refresh window.
        await vi.advanceTimersByTimeAsync(MIN_REFRESH_DELAY + 50);

        // Only the surviving timer fires → exactly one network refresh.
        expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("never schedules a synchronous (zero-delay) refresh even for an almost-expired token", async () => {
        vi.useFakeTimers();
        seedActiveSession(); // access token already within the refresh margin
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(okRefresh());

        armRefresh();
        // Before the floor elapses, nothing should have fired.
        await vi.advanceTimersByTimeAsync(MIN_REFRESH_DELAY - 50);
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});
