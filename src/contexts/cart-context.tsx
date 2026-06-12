"use client";

import React, {createContext, useContext, useEffect, useMemo, useSyncExternalStore} from "react";
import type {CartItem, Money, SurpriseBox} from "@/types";
import {ZERO_MONEY} from "@/types";
import {sumMoney} from "@/lib/utils";
import type {ServerCart, ServerCartItem} from "@/types/cart";
import {useAuth} from "@/contexts/auth-context";
import {
    useCart as useServerCartQuery,
    useAddToCartMutation,
    useUpdateQuantityMutation,
    useRemoveItemMutation,
    useClearCartMutation,
} from "@/lib/queries/cart-queries";
import {useCartBroadcast} from "@/hooks/use-cart-broadcast";
import {guestCartBuffer} from "@/lib/cart-guest-buffer";
import {migrateLegacyCartIfNeeded} from "@/lib/cart-migration";

export interface CartContextType {
    cartItems: CartItem[];
    cartCount: number;
    cartTotal: Money;
    addToCart: (box: SurpriseBox, quantity?: number) => void;
    removeFromCart: (boxId: string) => void;
    updateQuantity: (boxId: string, quantity: number) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

function serverToCartItem(item: ServerCartItem): CartItem {
    return {
        boxId: item.itemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        storeId: item.storeId,
        storeName: "",
        image: item.imageUrl,
    };
}

export const CartProvider = ({children}: {children: React.ReactNode}) => {
    const {isAuthenticated} = useAuth();
    useEffect(() => {
        migrateLegacyCartIfNeeded();
    }, []);
    useCartBroadcast();

    const cartQuery = useServerCartQuery({isAuthenticated});
    const addMutation = useAddToCartMutation();
    const updateMutation = useUpdateQuantityMutation();
    const removeMutation = useRemoveItemMutation();
    const clearMutation = useClearCartMutation();

    const guestEntriesSnapshot = useSyncExternalStore(
        guestCartBuffer.subscribe,
        guestCartBuffer.getSnapshot,   // stable reference — only changes after a write
        () => [],                       // SSR snapshot — always empty for guest cart
    );

    const value = useMemo<CartContextType>(() => {
        if (isAuthenticated) {
            const server: ServerCart | undefined = cartQuery.data;
            const items = (server?.items ?? []).map(serverToCartItem);
            return {
                cartItems: items,
                cartCount: server?.itemCount ?? 0,
                cartTotal: server?.totalPrice ?? ZERO_MONEY,
                addToCart: (box: SurpriseBox, quantity = 1) => {
                    addMutation.mutate({
                        itemId: box.id,
                        quantity,
                        name: box.name ?? "Surprise Box",
                        price: box.price,
                        imageUrl: box.image ?? "",
                        storeId: box.storeId ?? "",
                    });
                },
                removeFromCart: (boxId: string) => {
                    // Backend DELETE /cart/items/{itemId} matches by surprise-box itemId, not cart-item PK.
                    removeMutation.mutate({cartItemId: boxId});
                },
                updateQuantity: (boxId: string, quantity: number) => {
                    // Backend PUT /cart/items/{itemId} matches by surprise-box itemId.
                    updateMutation.mutate({cartItemId: boxId, quantity});
                },
                clearCart: () => clearMutation.mutate(),
            };
        }

        // Guest mode — read from localStorage buffer; entries may carry display fields
        // captured at the time of addToCart so the cart UI can render them without a re-fetch.
        const entries = guestEntriesSnapshot;
        const guestItems: CartItem[] = entries.map((e) => ({
            boxId: e.itemId,
            name: e.name ?? "",
            price: e.price ?? ZERO_MONEY,
            quantity: e.quantity,
            storeId: e.storeId ?? "",
            storeName: e.storeName ?? "",
            image: e.imageUrl ?? "",
        }));
        return {
            cartItems: guestItems,
            cartCount: entries.reduce((sum, e) => sum + e.quantity, 0),
            cartTotal: sumMoney(guestItems),
            addToCart: (box: SurpriseBox, quantity = 1) =>
                guestCartBuffer.add({
                    itemId: box.id,
                    quantity,
                    name: box.name,
                    price: box.price,
                    imageUrl: box.image,
                    storeId: box.storeId,
                    storeName: box.storeName,
                }),
            removeFromCart: (boxId: string) => guestCartBuffer.removeItem(boxId),
            updateQuantity: (boxId: string, quantity: number) =>
                guestCartBuffer.setQuantity(boxId, quantity),
            clearCart: () => guestCartBuffer.clear(),
        };
    }, [
        isAuthenticated,
        cartQuery.data,
        addMutation,
        updateMutation,
        removeMutation,
        clearMutation,
        guestEntriesSnapshot,
    ]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart(): CartContextType {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within <CartProvider>");
    return ctx;
}
