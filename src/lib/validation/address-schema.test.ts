import {describe, expect, it} from "vitest";
import {ADDRESS_LIMITS, createAddressSchema} from "./address-schema";

// Minimal stand-in for the locale `t(section, key)` function. Returns a stable
// token per message key so we can assert which rule fired.
const t = (_section: string, key: string): string => {
    switch (key) {
        case "required":
            return "Обовʼязкове поле";
        case "maxLength":
            return "Максимум {n} символів";
        case "minLength":
            return "Мінімум {n} символів";
        case "postalCodeDigits":
            return "Індекс — лише цифри";
        case "lettersOnly":
            return "Лише літери";
        case "invalidChars":
            return "Недопустимі символи";
        default:
            return key;
    }
};

const schema = createAddressSchema(t);

const validAddress = {
    title: "Дім",
    addressType: "HOME" as const,
    street: "вул. Хрещатик, 12/3",
    city: "Київ",
    state: "",
    postalCode: "01001",
    country: "Україна",
    isDefault: true,
};

const messageFor = (result: ReturnType<typeof schema.safeParse>, field: string) =>
    !result.success ? result.error.issues.find((i) => i.path[0] === field)?.message : undefined;

describe("createAddressSchema — happy path", () => {
    it("accepts a realistic address", () => {
        expect(schema.safeParse(validAddress).success).toBe(true);
    });

    it("accepts an empty optional state", () => {
        expect(schema.safeParse({...validAddress, state: ""}).success).toBe(true);
    });

    it("accepts a multi-word city and a hyphenated region", () => {
        expect(schema.safeParse({...validAddress, city: "Кривий Ріг", state: "Івано-Франківська"}).success).toBe(true);
    });

    it("accepts a street with house number and punctuation", () => {
        expect(schema.safeParse({...validAddress, street: "вул. Шевченка, буд. 12, кв. 3"}).success).toBe(true);
    });
});

describe("createAddressSchema — required & length", () => {
    it.each(["title", "street", "city", "postalCode", "country"] as const)(
        "rejects empty required field %s with the required message",
        (field) => {
            expect(messageFor(schema.safeParse({...validAddress, [field]: ""}), field)).toBe("Обовʼязкове поле");
        },
    );

    it.each([
        ["title", ADDRESS_LIMITS.title],
        ["city", ADDRESS_LIMITS.city],
        ["country", ADDRESS_LIMITS.country],
    ] as const)("rejects %s over its limit of %i", (field, max) => {
        expect(messageFor(schema.safeParse({...validAddress, [field]: "Я".repeat(max + 1)}), field)).toBe(
            "Максимум " + max + " символів",
        );
    });
});

describe("createAddressSchema — postal code format", () => {
    it("rejects the alphanumeric garbage that used to slip through", () => {
        // The exact value from the reported screenshot.
        expect(messageFor(schema.safeParse({...validAddress, postalCode: "вароплвар489у7593487"}), "postalCode"))
            .toBe("Індекс — лише цифри");
    });

    it("rejects letters mixed into the postal code", () => {
        expect(messageFor(schema.safeParse({...validAddress, postalCode: "0100x"}), "postalCode"))
            .toBe("Індекс — лише цифри");
    });

    it("rejects a too-short numeric postal code", () => {
        expect(schema.safeParse({...validAddress, postalCode: "12"}).success).toBe(false);
    });

    it("accepts a plain 5-digit postal code", () => {
        expect(schema.safeParse({...validAddress, postalCode: "79000"}).success).toBe(true);
    });
});

describe("createAddressSchema — name-like fields reject digits and symbols", () => {
    it("rejects digits in the city", () => {
        expect(messageFor(schema.safeParse({...validAddress, city: "Київ123"}), "city")).toBe("Лише літери");
    });

    it("rejects symbols in the country", () => {
        expect(messageFor(schema.safeParse({...validAddress, country: "Україна!!!"}), "country")).toBe("Лише літери");
    });

    it("rejects digits in the state when provided", () => {
        expect(messageFor(schema.safeParse({...validAddress, state: "Обл4сть"}), "state")).toBe("Лише літери");
    });
});

describe("createAddressSchema — addressType", () => {
    it("rejects an unknown addressType", () => {
        expect(schema.safeParse({...validAddress, addressType: "GARAGE"}).success).toBe(false);
    });
});
