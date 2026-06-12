import {guestCartBuffer} from "./cart-guest-buffer";
import type {Money} from "@/types";

const LEGACY_KEY = "cart";

// Legacy cart entries stored `price` as a bare number; current entries use Money.
// Normalize either shape to Money (assume UAH for the legacy numeric form).
function toLegacyMoney(price: unknown): Money | undefined {
    if (typeof price === "number" && Number.isFinite(price)) {
        return {amount: price.toFixed(2), currency: "UAH"};
    }
    if (
        typeof price === "object" &&
        price !== null &&
        typeof (price as {amount?: unknown}).amount === "string" &&
        typeof (price as {currency?: unknown}).currency === "string"
    ) {
        return price as Money;
    }
    return undefined;
}

export function migrateLegacyCartIfNeeded(): void {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(LEGACY_KEY);
    if (raw === null) return;
    try {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            for (const entry of parsed) {
                if (
                    typeof entry === "object" &&
                    entry !== null &&
                    typeof (entry as {boxId?: unknown}).boxId === "string" &&
                    typeof (entry as {quantity?: unknown}).quantity === "number" &&
                    (entry as {quantity: number}).quantity > 0
                ) {
                    const e = entry as Record<string, unknown>;
                    guestCartBuffer.add({
                        itemId: e.boxId as string,
                        quantity: e.quantity as number,
                        name: typeof e.name === "string" ? e.name : undefined,
                        price: toLegacyMoney(e.price),
                        imageUrl: typeof e.image === "string" ? e.image : undefined,
                        storeId: typeof e.storeId === "string" ? e.storeId : undefined,
                        storeName: typeof e.storeName === "string" ? e.storeName : undefined,
                    });
                }
            }
        }
    } catch {
        // Corrupted legacy — drop it silently.
    }
    localStorage.removeItem(LEGACY_KEY);
}
