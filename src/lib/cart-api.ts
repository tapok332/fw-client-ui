import { authHttpClient } from "./auth-http-client";
import { ApiResponse } from "@/types/api";
import { AddToCartRequestBody, ServerCart } from "@/types/cart";

/**
 * Unwrap an ApiResponse<T> envelope.
 *
 * authHttpClient already parses JSON and returns T directly.
 * If the HTTP status was non-2xx it throws before we get here.
 * We still need to guard against `success: false` on a 2xx body.
 */
function unwrap<T>(envelope: ApiResponse<T>): T {
    if (!envelope.success) {
        throw new Error(envelope.message ?? envelope.error ?? "Request failed");
    }
    return envelope.data;
}

/**
 * Parse error thrown by authHttpClient on non-2xx.
 *
 * authHttpClient throws Error(errorText) where errorText is the raw
 * response body text. For JSON error bodies like
 *   {"success":false,"error":"boxNotFound"}
 * we extract the `error` field so callers get a readable message.
 */
function rethrowApiError(err: unknown): never {
    if (err instanceof Error) {
        let extracted: string | undefined;
        try {
            const parsed: unknown = JSON.parse(err.message);
            const candidate =
                (parsed as {error?: unknown})?.error ??
                (parsed as {message?: unknown})?.message;
            if (typeof candidate === "string") extracted = candidate;
        } catch {
            // not JSON — keep original
        }
        if (extracted !== undefined) throw new Error(extracted);
    }
    throw err;
}

export const cartApi = {
    /** GET /cart → ServerCart */
    async get(): Promise<ServerCart> {
        try {
            const envelope = await authHttpClient.get<ApiResponse<ServerCart>>("/cart");
            return unwrap(envelope);
        } catch (err) {
            rethrowApiError(err);
        }
    },

    /** POST /cart/items → ServerCart */
    async addItem(body: AddToCartRequestBody): Promise<ServerCart> {
        try {
            const envelope = await authHttpClient.post<ApiResponse<ServerCart>>("/cart/items", body);
            return unwrap(envelope);
        } catch (err) {
            rethrowApiError(err);
        }
    },

    /**
     * PUT /cart/items/:itemId → ServerCart
     * @param itemId  server-generated cart-item `id` (UUID, NOT the box id)
     */
    async updateQuantity(itemId: string, quantity: number): Promise<ServerCart> {
        try {
            const envelope = await authHttpClient.put<ApiResponse<ServerCart>>(
                `/cart/items/${itemId}`,
                { quantity },
            );
            return unwrap(envelope);
        } catch (err) {
            rethrowApiError(err);
        }
    },

    /**
     * DELETE /cart/items/:itemId → ServerCart
     * @param itemId  server-generated cart-item `id` (UUID, NOT the box id)
     */
    async removeItem(itemId: string): Promise<ServerCart> {
        try {
            const envelope = await authHttpClient.delete<ApiResponse<ServerCart>>(
                `/cart/items/${itemId}`,
            );
            return unwrap(envelope);
        } catch (err) {
            rethrowApiError(err);
        }
    },

    /** DELETE /cart → void */
    async clear(): Promise<void> {
        try {
            await authHttpClient.delete<ApiResponse<null>>("/cart");
        } catch (err) {
            rethrowApiError(err);
        }
    },
};
