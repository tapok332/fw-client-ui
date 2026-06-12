import { describe, it, expect } from "vitest";
import { formatMoney } from "./utils";

describe("formatMoney", () => {
    it("formats a UAH Money value as a uk-UA currency string", () => {
        const out = formatMoney({ amount: "300.00", currency: "UAH" });
        // ICU spacing/NBSP and decimal separator vary by runtime — assert tolerantly.
        expect(out).toMatch(/300[.,]00/);
        expect(out).toContain("₴"); // ₴
    });

    it("formats fractional amounts", () => {
        const out = formatMoney({ amount: "12.50", currency: "UAH" });
        expect(out).toMatch(/12[.,]50/);
        expect(out).toContain("₴");
    });

    it("formats a non-UAH currency using its ISO code/symbol", () => {
        const out = formatMoney({ amount: "9.99", currency: "USD" });
        expect(out).toMatch(/9[.,]99/);
        // In the uk-UA locale, USD renders with its ISO code ("USD"), not "$".
        expect(out).toContain("USD");
    });

    it("returns a placeholder for null/undefined input", () => {
        // Defensive: existing call-sites may pass an absent Money.
        expect(formatMoney(null)).toBe("");
        expect(formatMoney(undefined)).toBe("");
    });

    it("returns a placeholder when amount is not a parseable number", () => {
        expect(formatMoney({ amount: "", currency: "UAH" })).toBe("");
        expect(formatMoney({ amount: "abc", currency: "UAH" })).toBe("");
    });
});
