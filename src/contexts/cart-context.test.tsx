import {describe, expect, it, vi, beforeEach} from "vitest";
import {renderHook, waitFor} from "@testing-library/react";
import {ReactNode} from "react";
import {QueryClientProvider} from "@tanstack/react-query";
import {server} from "@/test/server";
import {cartHandlers} from "@/test/handlers/cart-handlers";
import {makeTestQueryClient} from "@/test/utils";

// Mock auth context — must be declared before the import of cart-context
vi.mock("@/contexts/auth-context", () => ({
    useAuth: () => ({
        isAuthenticated: true,
        isLoading: false,
        user: null,
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        requireAuth: vi.fn(),
    }),
    AuthProvider: ({children}: {children: ReactNode}) => <>{children}</>,
}));

import {CartProvider, useCart} from "./cart-context";

beforeEach(() => {
    localStorage.clear();
});

function makeWrapper(client = makeTestQueryClient()) {
    return function Wrapper({children}: {children: ReactNode}) {
        return (
            <QueryClientProvider client={client}>
                <CartProvider>{children}</CartProvider>
            </QueryClientProvider>
        );
    };
}

describe("CartContext compat wrapper (authenticated)", () => {
    it("exposes cartItems/cartCount/cartTotal from server", async () => {
        server.use(cartHandlers.getWithItem());
        const {result} = renderHook(() => useCart(), {wrapper: makeWrapper()});

        await waitFor(() => expect(result.current.cartItems).toHaveLength(1));
        expect(result.current.cartCount).toBe(1);
        expect(result.current.cartTotal).toEqual({amount: "150.00", currency: "UAH"});
    });

    it("maps ServerCartItem fields to CartItem shape", async () => {
        server.use(cartHandlers.getWithItem());
        const {result} = renderHook(() => useCart(), {wrapper: makeWrapper()});

        await waitFor(() => expect(result.current.cartItems).toHaveLength(1));
        const item = result.current.cartItems[0];
        // CartItem public shape expected by consumers
        expect(item.boxId).toBe("box-1");
        expect(item.name).toBe("Test Box");
        expect(item.price).toEqual({amount: "150.00", currency: "UAH"});
        expect(item.quantity).toBe(1);
        expect(item.storeId).toBe("store-1");
        expect(item.image).toBe("/img.jpg");
    });

    it("starts with empty cart when server returns empty", async () => {
        server.use(cartHandlers.getEmpty());
        const {result} = renderHook(() => useCart(), {wrapper: makeWrapper()});

        await waitFor(() => expect(result.current.cartItems).toBeDefined());
        expect(result.current.cartItems).toHaveLength(0);
        expect(result.current.cartCount).toBe(0);
        expect(result.current.cartTotal).toEqual({amount: "0.00", currency: "UAH"});
    });
});
