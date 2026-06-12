import { describe, it, expect } from "vitest";
import { server } from "@/test/server";
import { cartHandlers } from "@/test/handlers/cart-handlers";
import { cartApi } from "./cart-api";

describe("cartApi", () => {
    it("get() returns ServerCart on success", async () => {
        server.use(cartHandlers.getWithItem());

        const cart = await cartApi.get();

        expect(cart.cartId).toBe("00000000-0000-0000-0000-000000000001");
        expect(cart.items).toHaveLength(1);
        expect(cart.items[0].name).toBe("Test Box");
        expect(cart.totalPrice).toEqual({ amount: "150.00", currency: "UAH" });
    });

    it("get() throws on 401 (auth expired)", async () => {
        server.use(cartHandlers.unauthorized());

        // authHttpClient will attempt token refresh, find no refresh token,
        // and throw "No refresh token available"
        await expect(cartApi.get()).rejects.toThrow();
    });

    it("addItem() returns updated ServerCart on success", async () => {
        server.use(cartHandlers.addItem());

        const cart = await cartApi.addItem({ itemId: "box-1", quantity: 1 });

        expect(cart.itemCount).toBe(1);
        expect(cart.items[0].itemId).toBe("box-1");
    });

    it("addItem() throws with error message on 400", async () => {
        server.use(cartHandlers.addItemFails(400, "boxNotFound"));

        await expect(
            cartApi.addItem({ itemId: "nonexistent-box", quantity: 1 }),
        ).rejects.toThrow("boxNotFound");
    });

    it("updateQuantity() sends PUT and returns updated cart", async () => {
        server.use(cartHandlers.updateQuantity(3));

        const cart = await cartApi.updateQuantity("cart-item-1", 3);

        expect(cart.items[0].quantity).toBe(3);
    });

    it("removeItem() sends DELETE /cart/items/:id and returns updated cart", async () => {
        server.use(cartHandlers.removeItem());

        const cart = await cartApi.removeItem("cart-item-1");

        expect(cart.items).toHaveLength(0);
        expect(cart.itemCount).toBe(0);
    });

    it("clear() sends DELETE /cart and resolves to void", async () => {
        server.use(cartHandlers.clear());

        const result = await cartApi.clear();

        expect(result).toBeUndefined();
    });
});
