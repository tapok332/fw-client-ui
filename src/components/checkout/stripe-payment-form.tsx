"use client";

import {
    forwardRef,
    useCallback,
    useImperativeHandle,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import {
    Elements,
    ExpressCheckoutElement,
    PaymentElement,
    useElements,
    useStripe,
} from "@stripe/react-stripe-js";
import type {
    StripeElementLocale,
    StripeExpressCheckoutElementConfirmEvent,
    StripeExpressCheckoutElementReadyEvent,
} from "@stripe/stripe-js";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { getStripe, getStripeAppearance, isStripeConfigured } from "@/lib/stripe";
import { useTranslation } from "@/contexts/locale-context";

export interface ConfirmIntent {
    clientSecret: string;
    orderId: string;
}

export interface StripeSubmitResult {
    ok: boolean;
    orderId?: string;
    error?: string;
    requiresAction?: boolean;
}

export interface StripePaymentFormHandle {
    submit: () => Promise<StripeSubmitResult>;
}

export interface StripePaymentFormProps {
    /** Order total in major currency units (e.g. UAH). Converted to minor units inside. */
    amount: number;
    currency?: "uah" | "usd" | "eur";
    locale?: "uk" | "en";
    mode?: "light" | "dark";
    returnUrl: string;
    /** Backend call: create order + Stripe PaymentIntent, return clientSecret. Called on submit. */
    onConfirmRequest: () => Promise<ConfirmIntent | { error: string }>;
    onAuthorizing?: () => void;
    onSuccess?: (orderId: string) => void;
    onError?: (message: string) => void;
}

const STRIPE_LOCALE_MAP: Record<"uk" | "en", StripeElementLocale> = {
    uk: "uk" as StripeElementLocale,
    en: "en" as StripeElementLocale,
};

interface InnerFormProps {
    returnUrl: string;
    onConfirmRequest: StripePaymentFormProps["onConfirmRequest"];
    onAuthorizing?: () => void;
    onSuccess?: (orderId: string) => void;
    onError?: (message: string) => void;
}

const InnerForm = forwardRef<StripePaymentFormHandle, InnerFormProps>(function InnerForm(
    { returnUrl, onConfirmRequest, onAuthorizing, onSuccess, onError },
    ref,
) {
    const stripe = useStripe();
    const elements = useElements();
    const { t } = useTranslation();
    const [expressReady, setExpressReady] = useState<boolean | null>(null);

    const runConfirm = useCallback(async (): Promise<StripeSubmitResult> => {
        if (!stripe || !elements) {
            const msg = t('checkout', 'paymentFormNotReady');
            onError?.(msg);
            return { ok: false, error: msg };
        }

        const { error: submitError } = await elements.submit();
        if (submitError) {
            const message = submitError.message ?? t('checkout', 'verifyCardDetails');
            onError?.(message);
            return { ok: false, error: message };
        }

        const intent = await onConfirmRequest();
        if ("error" in intent) {
            onError?.(intent.error);
            return { ok: false, error: intent.error };
        }

        onAuthorizing?.();
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            clientSecret: intent.clientSecret,
            confirmParams: { return_url: returnUrl },
            redirect: "if_required",
        });

        if (error) {
            const message = error.message ?? t('checkout', 'paymentFailed');
            onError?.(message);
            return {
                ok: false,
                error: message,
                orderId: intent.orderId,
                requiresAction: error.code === "payment_intent_authentication_failure",
            };
        }

        if (paymentIntent && paymentIntent.status === "succeeded") {
            onSuccess?.(intent.orderId);
            return { ok: true, orderId: intent.orderId };
        }

        // requires_action / requires_capture / processing → backend webhook will finalize
        return { ok: true, orderId: intent.orderId };
    }, [stripe, elements, returnUrl, onConfirmRequest, onAuthorizing, onError, onSuccess, t]);

    useImperativeHandle(ref, () => ({ submit: runConfirm }), [runConfirm]);

    const handleExpressConfirm = async (_event: StripeExpressCheckoutElementConfirmEvent) => {
        await runConfirm();
    };

    return (
        <div className="space-y-4">
            <div
                aria-hidden={expressReady === false}
                className={expressReady === false ? "hidden" : ""}
            >
                <ExpressCheckoutElement
                    onReady={(e: StripeExpressCheckoutElementReadyEvent) => {
                        setExpressReady(Boolean(e.availablePaymentMethods));
                    }}
                    onConfirm={handleExpressConfirm}
                    options={{
                        buttonType: { applePay: "buy", googlePay: "buy" },
                        buttonHeight: 48,
                        paymentMethodOrder: ["applePay", "googlePay", "link"],
                    }}
                />
                {expressReady && (
                    <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
                        <span className="h-px flex-1 bg-border" />
                        <span>{t('checkout', 'orByCard')}</span>
                        <span className="h-px flex-1 bg-border" />
                    </div>
                )}
            </div>

            <PaymentElement
                options={{
                    layout: { type: "tabs", defaultCollapsed: false },
                    wallets: { applePay: "never", googlePay: "never" },
                }}
            />

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                {t('checkout', 'stripeProtectedShort')}
            </p>
        </div>
    );
});

const SkeletonShell = ({ children }: { children?: ReactNode }) => (
    <div className="space-y-3 rounded-2xl border border-border bg-background/40 p-4">
        <div className="h-12 animate-pulse rounded-xl bg-muted/60" />
        <div className="h-12 animate-pulse rounded-xl bg-muted/40" />
        <div className="h-10 animate-pulse rounded-xl bg-muted/30" />
        {children}
    </div>
);

export const StripePaymentForm = forwardRef<StripePaymentFormHandle, StripePaymentFormProps>(
    function StripePaymentForm(
        {
            amount,
            currency = "uah",
            locale = "uk",
            mode = "light",
            returnUrl,
            onConfirmRequest,
            onAuthorizing,
            onSuccess,
            onError,
        },
        ref,
    ) {
        const { t } = useTranslation();
        const stripePromise = useMemo(() => getStripe(), []);
        const appearance = useMemo(() => getStripeAppearance(mode), [mode]);

        const minorAmount = Math.max(50, Math.round(amount * 100));

        if (!isStripeConfigured()) {
            return (
                <div
                    role="status"
                    className="flex items-start gap-3 rounded-2xl border border-amber-200/60 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100"
                >
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                    <div>
                        <p className="font-semibold">{t('checkout', 'onlinePaymentUnavailable')}</p>
                        <p className="mt-1 text-xs leading-relaxed">
                            {t('checkout', 'stripeNotConfigured')}
                        </p>
                    </div>
                </div>
            );
        }

        if (amount <= 0) {
            return (
                <SkeletonShell>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
                        {t('checkout', 'waitingForAmount')}
                    </p>
                </SkeletonShell>
            );
        }

        return (
            <Elements
                stripe={stripePromise}
                options={{
                    mode: "payment",
                    amount: minorAmount,
                    currency,
                    appearance,
                    locale: STRIPE_LOCALE_MAP[locale],
                    loader: "auto",
                    paymentMethodCreation: "manual",
                }}
            >
                <InnerForm
                    ref={ref}
                    returnUrl={returnUrl}
                    onConfirmRequest={onConfirmRequest}
                    onAuthorizing={onAuthorizing}
                    onSuccess={onSuccess}
                    onError={onError}
                />
            </Elements>
        );
    },
);
