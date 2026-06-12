import {describe, expect, it} from "vitest";
import {renderHook, waitFor, act} from "@testing-library/react";
import {QueryClientProvider} from "@tanstack/react-query";
import {ReactNode} from "react";
import {server} from "@/test/server";
import {cartHandlers} from "@/test/handlers/cart-handlers";
import {makeTestQueryClient} from "@/test/utils";
import {cartKeys, useAddToCartMutation, useCart, useClearCartMutation, useRemoveItemMutation, useUpdateQuantityMutation} from "./cart-queries";

function wrap(client = makeTestQueryClient()) {
    return ({children}: {children: ReactNode}) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

describe("useCart", () => {
    it("returns server cart when authenticated", async () => {
        server.use(cartHandlers.getWithItem());
        const {result} = renderHook(() => useCart({isAuthenticated: true}), {wrapper: wrap()});

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data?.items).toHaveLength(1);
        expect(result.current.data?.items[0].itemId).toBe("box-1");
    });

    it("does not fetch when unauthenticated", async () => {
        const client = makeTestQueryClient();
        const {result} = renderHook(() => useCart({isAuthenticated: false}), {wrapper: wrap(client)});
        expect(result.current.fetchStatus).toBe("idle");
    });

    it("surfaces 401 as error state", async () => {
        server.use(cartHandlers.unauthorized());
        const {result} = renderHook(() => useCart({isAuthenticated: true}), {wrapper: wrap()});
        await waitFor(() => expect(result.current.isError).toBe(true));
        // With no refresh token available the shared refresh manager bails and the
        // client surfaces a single "authentication expired" error.
        expect(result.current.error?.message).toMatch(/unauthorized|no refresh token|authentication expired/i);
    });
});

describe("useAddToCartMutation", () => {
    it("optimistically increases itemCount, confirms on server response", async () => {
        const client = makeTestQueryClient();
        client.setQueryData(cartKeys.all, {
            cartId: "c1", items: [], totalPrice: { amount: "0.00", currency: "UAH" }, itemCount: 0,
        });
        server.use(cartHandlers.addItem());

        const {result} = renderHook(() => useAddToCartMutation(), {wrapper: wrap(client)});

        act(() => {
            result.current.mutate({
                itemId: "box-1", quantity: 1,
                name: "Test Box", price: { amount: "150.00", currency: "UAH" }, imageUrl: "/img.jpg", storeId: "store-1",
            });
        });

        await waitFor(() => {
            const cached = client.getQueryData(cartKeys.all) as {itemCount: number} | undefined;
            expect(cached?.itemCount).toBe(1);
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        const final = client.getQueryData(cartKeys.all) as {items: unknown[]} | undefined;
        expect(final?.items).toHaveLength(1);
    });

    it("rolls back on server error", async () => {
        const client = makeTestQueryClient();
        client.setQueryData(cartKeys.all, {
            cartId: "c1", items: [], totalPrice: { amount: "0.00", currency: "UAH" }, itemCount: 0,
        });
        server.use(cartHandlers.addItemFails(400, "boxNotFound"));

        const {result} = renderHook(() => useAddToCartMutation(), {wrapper: wrap(client)});

        act(() => {
            result.current.mutate({itemId: "missing", quantity: 1, name: "X", price: { amount: "100.00", currency: "UAH" }, imageUrl: "", storeId: "s"});
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
        const cached = client.getQueryData(cartKeys.all) as {itemCount: number; items: unknown[]} | undefined;
        expect(cached?.itemCount).toBe(0);
        expect(cached?.items).toHaveLength(0);
    });
});

describe("useUpdateQuantityMutation", () => {
    it("optimistically updates quantity then confirms with server", async () => {
        const client = makeTestQueryClient();
        client.setQueryData(cartKeys.all, {
            cartId: "c1",
            items: [{id: "ci-1", itemId: "box-1", name: "X", price: { amount: "100.00", currency: "UAH" }, quantity: 1, storeId: "s", imageUrl: ""}],
            totalPrice: { amount: "100.00", currency: "UAH" },
            itemCount: 1,
        });
        server.use(cartHandlers.updateQuantity(5));

        const {result} = renderHook(() => useUpdateQuantityMutation(), {wrapper: wrap(client)});

        act(() => {
            // cartItemId == surprise-box itemId per backend contract
            result.current.mutate({cartItemId: "box-1", quantity: 5});
        });

        await waitFor(() => {
            const cached = client.getQueryData(cartKeys.all) as {items: {quantity: number}[]} | undefined;
            expect(cached?.items[0].quantity).toBe(5);
        });
    });
});

describe("useRemoveItemMutation", () => {
    it("optimistically removes the item then confirms with server", async () => {
        const client = makeTestQueryClient();
        client.setQueryData(cartKeys.all, {
            cartId: "c1",
            items: [{id: "ci-1", itemId: "box-1", name: "X", price: { amount: "100.00", currency: "UAH" }, quantity: 2, storeId: "s", imageUrl: ""}],
            totalPrice: { amount: "200.00", currency: "UAH" },
            itemCount: 2,
        });
        server.use(cartHandlers.removeItem());

        const {result} = renderHook(() => useRemoveItemMutation(), {wrapper: wrap(client)});
        act(() => result.current.mutate({cartItemId: "box-1"}));

        await waitFor(() => {
            const cached = client.getQueryData(cartKeys.all) as {items: unknown[]; itemCount: number} | undefined;
            expect(cached?.items).toHaveLength(0);
            expect(cached?.itemCount).toBe(0);
        });
    });
});

describe("useClearCartMutation", () => {
    it("optimistically empties the cart", async () => {
        const client = makeTestQueryClient();
        client.setQueryData(cartKeys.all, {
            cartId: "c1",
            items: [{id: "ci-1", itemId: "b", name: "X", price: { amount: "100.00", currency: "UAH" }, quantity: 1, storeId: "s", imageUrl: ""}],
            totalPrice: { amount: "100.00", currency: "UAH" },
            itemCount: 1,
        });
        server.use(cartHandlers.clear());

        const {result} = renderHook(() => useClearCartMutation(), {wrapper: wrap(client)});
        act(() => result.current.mutate());

        await waitFor(() => {
            const cached = client.getQueryData(cartKeys.all) as {items: unknown[]} | undefined;
            expect(cached?.items).toHaveLength(0);
        });
    });
});
