import "@testing-library/jest-dom/vitest";
import {server} from "./src/test/server";
import {afterAll, afterEach, beforeAll} from "vitest";

// Node 25 ships a native `localStorage` global that lacks .getItem/.setItem
// unless --localstorage-file is supplied. Override with an in-memory shim so
// auth-http-client (which reads from localStorage) works in tests.
if (typeof localStorage === "undefined" || typeof localStorage.getItem !== "function") {
    const store: Record<string, string> = {};
    (globalThis as unknown as Record<string, unknown>).localStorage = {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); },
        key: (index: number) => Object.keys(store)[index] ?? null,
        get length() { return Object.keys(store).length; },
    };
}

beforeAll(() => server.listen({onUnhandledRequest: "error"}));
afterEach(() => server.resetHandlers());
afterEach(() => {
    if (typeof localStorage !== "undefined" && typeof localStorage.clear === "function") {
        localStorage.clear();
    }
});
afterAll(() => server.close());
