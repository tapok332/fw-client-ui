import {z} from "zod";

/**
 * Maximum field lengths. These mirror the `@Size` constraints on
 * `fw-profile-service` `AddressDto` so the client rejects over-long input
 * before it reaches the backend (which would otherwise answer 400 with
 * "розмір має бути між 0 та N"). Keep in sync if the backend DTO changes.
 */
export const ADDRESS_LIMITS = {
    title: 100,
    street: 255,
    city: 100,
    state: 100,
    postalCode: 20,
    country: 100,
} as const;

type TranslateFn = (key: string, subKey: string, defaultValue?: string) => string;

/** Minimum sensible lengths (length alone is not enough, but blocks 1-char junk). */
export const ADDRESS_MIN = {
    title: 2,
    street: 3,
    city: 2,
    country: 2,
} as const;

// Format rules. These reject obvious garbage (digits in a city name, letters in a
// postal code) but cannot judge *meaning* — a real place name vs. random letters
// needs geocoding/autocomplete, which is out of scope here.
//
// Postal code: digits only. UA codes are 5 digits; 4–10 keeps cross-border input
// working while still rejecting letters/symbols.
const POSTAL_CODE_RE = /^\d{4,10}$/;
// Name-like (city, state, country): must start with a letter; letters, spaces,
// apostrophes, dots and hyphens only. No digits, no random symbols.
const NAME_RE = /^\p{L}[\p{L} '.’-]*$/u;
// Street: name + house number + common address punctuation.
const STREET_RE = /^[\p{L}\d][\p{L}\d '.,/№’-]*$/u;
// Title: a free-form label — letters/digits + light punctuation.
const TITLE_RE = /^[\p{L}\d][\p{L}\d '.’-]*$/u;

/**
 * Builds the address validation schema bound to the current locale. Rebuilt per
 * render so messages re-localize when the user switches language. `state` is the
 * only optional field — it has no `@NotBlank` on the backend.
 */
export function createAddressSchema(t: TranslateFn) {
    const required = t("common", "required");
    const tooLong = (max: number) => t("common", "maxLength").replace("{n}", String(max));
    const tooShort = (min: number) => t("common", "minLength").replace("{n}", String(min));
    const lettersOnly = t("common", "lettersOnly");
    const postalDigits = t("common", "postalCodeDigits");
    const invalidChars = t("common", "invalidChars");

    return z.object({
        title: z
            .string()
            .min(1, required)
            .min(ADDRESS_MIN.title, tooShort(ADDRESS_MIN.title))
            .max(ADDRESS_LIMITS.title, tooLong(ADDRESS_LIMITS.title))
            .regex(TITLE_RE, invalidChars),
        addressType: z.enum(["HOME", "WORK", "OTHER"]),
        street: z
            .string()
            .min(1, required)
            .min(ADDRESS_MIN.street, tooShort(ADDRESS_MIN.street))
            .max(ADDRESS_LIMITS.street, tooLong(ADDRESS_LIMITS.street))
            .regex(STREET_RE, invalidChars),
        city: z
            .string()
            .min(1, required)
            .min(ADDRESS_MIN.city, tooShort(ADDRESS_MIN.city))
            .max(ADDRESS_LIMITS.city, tooLong(ADDRESS_LIMITS.city))
            .regex(NAME_RE, lettersOnly),
        // Optional: empty passes, otherwise it must look like a region name.
        state: z
            .string()
            .max(ADDRESS_LIMITS.state, tooLong(ADDRESS_LIMITS.state))
            .refine((v) => v === "" || NAME_RE.test(v), lettersOnly),
        postalCode: z.string().min(1, required).regex(POSTAL_CODE_RE, postalDigits),
        country: z
            .string()
            .min(1, required)
            .min(ADDRESS_MIN.country, tooShort(ADDRESS_MIN.country))
            .max(ADDRESS_LIMITS.country, tooLong(ADDRESS_LIMITS.country))
            .regex(NAME_RE, lettersOnly),
        isDefault: z.boolean(),
    });
}

export type AddressFormValues = z.infer<ReturnType<typeof createAddressSchema>>;

/**
 * Composes the single-line `fullAddress` the backend stores from the structured
 * fields. Shared by the form preview and the create/update payloads so they
 * never drift.
 */
export function composeFullAddress(
    v: Pick<AddressFormValues, "street" | "city" | "state" | "country" | "postalCode">,
): string {
    return [v.street, v.city, v.state, v.country, v.postalCode].filter(Boolean).join(", ");
}
