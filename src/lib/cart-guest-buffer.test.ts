import {describe, expect, it, beforeEach, vi} from "vitest";
import {guestCartBuffer} from "./cart-guest-buffer";

beforeEach(() => {
    localStorage.clear();
});

describe("guestCartBuffer", () => {
    it("returns empty list when nothing stored", () => {
        expect(guestCartBuffer.read()).toEqual([]);
    });

    it("appends new item", () => {
        guestCartBuffer.add({itemId: "box-1", quantity: 1});
        expect(guestCartBuffer.read()).toEqual([{itemId: "box-1", quantity: 1}]);
    });

    it("merges quantities for duplicate itemId", () => {
        guestCartBuffer.add({itemId: "box-1", quantity: 1});
        guestCartBuffer.add({itemId: "box-1", quantity: 2});
        expect(guestCartBuffer.read()).toEqual([{itemId: "box-1", quantity: 3}]);
    });

    it("removeItem deletes by itemId", () => {
        guestCartBuffer.add({itemId: "box-1", quantity: 1});
        guestCartBuffer.add({itemId: "box-2", quantity: 1});
        guestCartBuffer.removeItem("box-1");
        expect(guestCartBuffer.read()).toEqual([{itemId: "box-2", quantity: 1}]);
    });

    it("setQuantity replaces, treats 0 as delete", () => {
        guestCartBuffer.add({itemId: "box-1", quantity: 1});
        guestCartBuffer.setQuantity("box-1", 5);
        expect(guestCartBuffer.read()).toEqual([{itemId: "box-1", quantity: 5}]);
        guestCartBuffer.setQuantity("box-1", 0);
        expect(guestCartBuffer.read()).toEqual([]);
    });

    it("clear empties the buffer", () => {
        guestCartBuffer.add({itemId: "box-1", quantity: 1});
        guestCartBuffer.clear();
        expect(guestCartBuffer.read()).toEqual([]);
    });

    it("read survives corrupted JSON", () => {
        localStorage.setItem("foodwise.guest-cart.v1", "not-json");
        expect(guestCartBuffer.read()).toEqual([]);
    });

    it("subscribe receives notifications on add, removeItem, and clear", () => {
        const listener = vi.fn();
        guestCartBuffer.subscribe(listener);

        guestCartBuffer.add({itemId: "box-1", quantity: 1});
        expect(listener).toHaveBeenCalledTimes(1);

        guestCartBuffer.removeItem("box-1");
        expect(listener).toHaveBeenCalledTimes(2);

        guestCartBuffer.clear();
        expect(listener).toHaveBeenCalledTimes(3);
    });

    it("unsubscribe stops further notifications", () => {
        const listener = vi.fn();
        const unsubscribe = guestCartBuffer.subscribe(listener);

        guestCartBuffer.add({itemId: "box-1", quantity: 1});
        expect(listener).toHaveBeenCalledTimes(1);

        unsubscribe();
        guestCartBuffer.add({itemId: "box-2", quantity: 1});
        expect(listener).toHaveBeenCalledTimes(1); // no additional calls
    });

    it("preserves display fields across reads", () => {
        guestCartBuffer.add({
            itemId: "box-1",
            quantity: 1,
            name: "Sushi Box",
            price: { amount: "250.00", currency: "UAH" },
            imageUrl: "/img.jpg",
            storeId: "store-1",
            storeName: "Sushi Place",
        });
        expect(guestCartBuffer.read()).toEqual([
            {
                itemId: "box-1",
                quantity: 1,
                name: "Sushi Box",
                price: { amount: "250.00", currency: "UAH" },
                imageUrl: "/img.jpg",
                storeId: "store-1",
                storeName: "Sushi Place",
            },
        ]);
    });

    it("setQuantity keeps display fields", () => {
        guestCartBuffer.add({
            itemId: "box-1",
            quantity: 1,
            name: "Sushi Box",
            price: { amount: "250.00", currency: "UAH" },
        });
        guestCartBuffer.setQuantity("box-1", 3);
        const result = guestCartBuffer.read();
        expect(result[0].name).toBe("Sushi Box");
        expect(result[0].price).toEqual({ amount: "250.00", currency: "UAH" });
        expect(result[0].quantity).toBe(3);
    });
});
