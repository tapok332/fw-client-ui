import {describe, expect, it, beforeEach} from "vitest";
import {guestCartBuffer} from "./cart-guest-buffer";
import {migrateLegacyCartIfNeeded} from "./cart-migration";

beforeEach(() => localStorage.clear());

describe("migrateLegacyCartIfNeeded", () => {
    it("moves legacy items into guest buffer and deletes legacy key", () => {
        localStorage.setItem(
            "cart",
            JSON.stringify([
                {boxId: "box-1", quantity: 2, name: "X", price: 100, storeId: "s", storeName: "SN", image: "/i.jpg"},
                {boxId: "box-2", quantity: 1, name: "Y", price: 50, storeId: "s", storeName: "", image: ""},
            ]),
        );

        migrateLegacyCartIfNeeded();

        // Legacy numeric prices are normalized to the Money wire form (assume UAH).
        expect(guestCartBuffer.read()).toEqual([
            {itemId: "box-1", quantity: 2, name: "X", price: {amount: "100.00", currency: "UAH"}, storeId: "s", storeName: "SN", imageUrl: "/i.jpg"},
            {itemId: "box-2", quantity: 1, name: "Y", price: {amount: "50.00", currency: "UAH"}, storeId: "s", storeName: "", imageUrl: ""},
        ]);
        expect(localStorage.getItem("cart")).toBeNull();
    });

    it("carries over display fields", () => {
        localStorage.setItem(
            "cart",
            JSON.stringify([
                {boxId: "box-1", quantity: 2, name: "X", price: 100, storeId: "s", storeName: "SN", image: "/i.jpg"},
            ]),
        );
        migrateLegacyCartIfNeeded();
        const entries = guestCartBuffer.read();
        expect(entries[0].name).toBe("X");
        expect(entries[0].price).toEqual({amount: "100.00", currency: "UAH"});
        expect(entries[0].imageUrl).toBe("/i.jpg");
        expect(entries[0].storeId).toBe("s");
        expect(entries[0].storeName).toBe("SN");
    });

    it("noop when no legacy key present", () => {
        migrateLegacyCartIfNeeded();
        expect(guestCartBuffer.read()).toEqual([]);
    });

    it("noop on corrupted legacy data — deletes it silently", () => {
        localStorage.setItem("cart", "not-json");
        migrateLegacyCartIfNeeded();
        expect(localStorage.getItem("cart")).toBeNull();
        expect(guestCartBuffer.read()).toEqual([]);
    });
});
