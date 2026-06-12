import { loadStripe, type Stripe, type Appearance } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = (): Promise<Stripe | null> => {
    if (!stripePromise) {
        stripePromise = publishableKey ? loadStripe(publishableKey) : Promise.resolve(null);
    }
    return stripePromise;
};

export const isStripeConfigured = (): boolean => publishableKey.length > 0;

const brandPrimary = "#1E7A3A";
const brandPrimaryHover = "#176030";
const brandSurface = "#FFFFFF";
const brandText = "#1A2B1F";
const brandMuted = "#6B7A6E";
const brandBorder = "#E5E0D6";
const brandDanger = "#C0392B";
const brandFocusRing = "rgba(30, 122, 58, 0.35)";

export const getStripeAppearance = (mode: "light" | "dark" = "light"): Appearance => {
    const isDark = mode === "dark";
    return {
        theme: isDark ? "night" : "stripe",
        labels: "floating",
        variables: {
            colorPrimary: brandPrimary,
            colorBackground: isDark ? "#0F1A12" : brandSurface,
            colorText: isDark ? "#F5F2EB" : brandText,
            colorTextSecondary: isDark ? "#A8B4AC" : brandMuted,
            colorTextPlaceholder: isDark ? "#6B7A6E" : "#9AA39C",
            colorIcon: isDark ? "#A8B4AC" : brandMuted,
            colorDanger: brandDanger,
            colorSuccess: brandPrimary,
            fontFamily:
                'var(--font-body), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSizeBase: "15px",
            fontWeightNormal: "500",
            fontWeightMedium: "600",
            spacingUnit: "4px",
            borderRadius: "12px",
        },
        rules: {
            ".Input": {
                border: `1px solid ${isDark ? "#2A3A2E" : brandBorder}`,
                boxShadow: "none",
                padding: "14px 14px",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            },
            ".Input:focus": {
                borderColor: brandPrimary,
                boxShadow: `0 0 0 3px ${brandFocusRing}`,
            },
            ".Input--invalid": {
                borderColor: brandDanger,
                boxShadow: `0 0 0 3px rgba(192, 57, 43, 0.18)`,
            },
            ".Label": {
                fontWeight: "600",
                marginBottom: "6px",
            },
            ".Tab": {
                border: `1px solid ${isDark ? "#2A3A2E" : brandBorder}`,
                borderRadius: "12px",
                padding: "12px 14px",
                transition: "border-color 0.15s ease, background-color 0.15s ease",
            },
            ".Tab:hover": {
                borderColor: brandPrimary,
            },
            ".Tab--selected": {
                borderColor: brandPrimary,
                backgroundColor: isDark ? "rgba(30, 122, 58, 0.16)" : "rgba(30, 122, 58, 0.06)",
                boxShadow: `0 0 0 1px ${brandPrimary}`,
            },
            ".Block": {
                backgroundColor: isDark ? "#142019" : "#FBF9F6",
                border: `1px solid ${isDark ? "#1F2A22" : brandBorder}`,
                borderRadius: "16px",
                padding: "16px",
            },
            ".PickerItem": {
                borderRadius: "12px",
            },
            ".PickerItem--selected": {
                borderColor: brandPrimary,
                backgroundColor: isDark ? "rgba(30, 122, 58, 0.18)" : "rgba(30, 122, 58, 0.06)",
            },
        },
    };
};

export const STRIPE_BRAND = {
    primary: brandPrimary,
    primaryHover: brandPrimaryHover,
    danger: brandDanger,
};
