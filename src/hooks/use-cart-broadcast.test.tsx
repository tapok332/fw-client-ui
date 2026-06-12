import {describe, expect, it, vi, beforeEach} from "vitest";
import {renderHook, act} from "@testing-library/react";
import {QueryClientProvider} from "@tanstack/react-query";
import {ReactNode} from "react";
import {makeTestQueryClient} from "@/test/utils";
import {cartKeys} from "@/lib/queries/cart-queries";
import {useCartBroadcast, broadcastCartChanged} from "./use-cart-broadcast";

// jsdom does not implement BroadcastChannel — provide a minimal in-memory polyfill.
class FakeBroadcastChannel {
    static channels = new Map<string, Set<FakeBroadcastChannel>>();
    listeners: ((ev: MessageEvent) => void)[] = [];
    constructor(public name: string) {
        const set = FakeBroadcastChannel.channels.get(name) ?? new Set();
        set.add(this);
        FakeBroadcastChannel.channels.set(name, set);
    }
    postMessage(data: unknown) {
        const set = FakeBroadcastChannel.channels.get(this.name);
        set?.forEach((ch) => {
            if (ch !== this) ch.listeners.forEach((l) => l({data} as MessageEvent));
        });
    }
    addEventListener(_t: string, fn: (ev: MessageEvent) => void) {
        this.listeners.push(fn);
    }
    removeEventListener(_t: string, fn: (ev: MessageEvent) => void) {
        this.listeners = this.listeners.filter((l) => l !== fn);
    }
    close() {
        FakeBroadcastChannel.channels.get(this.name)?.delete(this);
    }
}

beforeEach(() => {
    (globalThis as unknown as {BroadcastChannel: typeof FakeBroadcastChannel}).BroadcastChannel = FakeBroadcastChannel;
    FakeBroadcastChannel.channels.clear();
});

describe("useCartBroadcast", () => {
    it("invalidates cart query when sibling broadcasts", async () => {
        const client = makeTestQueryClient();
        const spy = vi.spyOn(client, "invalidateQueries");
        const wrap = ({children}: {children: ReactNode}) => (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        );

        renderHook(() => useCartBroadcast(), {wrapper: wrap});

        act(() => broadcastCartChanged());

        expect(spy).toHaveBeenCalledWith({queryKey: cartKeys.all});
    });
});
