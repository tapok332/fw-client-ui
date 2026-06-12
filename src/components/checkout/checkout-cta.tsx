"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/locale-context";

export type CheckoutCtaState =
    | "idle"
    | "preparing"
    | "submitting"
    | "authorizing"
    | "success"
    | "error";

export interface CheckoutCtaProps {
    state: CheckoutCtaState;
    amountLabel: string;
    primaryLabel: string;
    helperText?: string;
    errorMessage?: string | null;
    disabled?: boolean;
    onSubmit: () => void;
    onRetry?: () => void;
    sticky?: boolean;
}

export function CheckoutCta({
    state,
    amountLabel,
    primaryLabel,
    helperText,
    errorMessage,
    disabled,
    onSubmit,
    onRetry,
    sticky = false,
}: CheckoutCtaProps) {
    const { t } = useTranslation();
    const statusId = useId();
    const errorId = useId();
    const [shake, setShake] = useState(false);
    const prevState = useRef(state);

    const STATE_TEXT = useMemo<Record<CheckoutCtaState, string | null>>(() => ({
        idle: null,
        preparing: t('checkout', 'preparingPayment'),
        submitting: t('checkout', 'processingPayment'),
        authorizing: t('checkout', 'bankConfirmation'),
        success: t('checkout', 'ready'),
        error: null,
    }), [t]);

    useEffect(() => {
        if (prevState.current !== "error" && state === "error") {
            setShake(true);
            const t = setTimeout(() => setShake(false), 320);
            prevState.current = state;
            return () => clearTimeout(t);
        }
        prevState.current = state;
    }, [state]);

    const isBusy = state === "preparing" || state === "submitting" || state === "authorizing";
    const isDone = state === "success";
    const isError = state === "error";
    const buttonDisabled = disabled || isBusy || isDone;

    const buttonLabel = (() => {
        if (isDone) return STATE_TEXT.success;
        if (state === "preparing") return STATE_TEXT.preparing;
        if (state === "submitting") return STATE_TEXT.submitting;
        if (state === "authorizing") return STATE_TEXT.authorizing;
        return primaryLabel;
    })();

    const announce = (() => {
        if (state === "preparing") return STATE_TEXT.preparing;
        if (state === "submitting") return STATE_TEXT.submitting;
        if (state === "authorizing") return STATE_TEXT.authorizing;
        if (state === "success") return t('checkout', 'paymentSuccess');
        if (state === "error" && errorMessage) return errorMessage;
        return "";
    })();

    return (
        <div
            className={cn(
                "checkout-cta-root",
                sticky &&
                    "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur md:static md:inset-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none",
            )}
        >
            {sticky && (
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-background/95 to-transparent md:hidden"
                />
            )}

            {isError && errorMessage && (
                <div
                    id={errorId}
                    role="alert"
                    className="mb-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
                >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <div className="flex-1">
                        <p className="font-medium">{t('checkout', 'paymentDidNotGoThrough')}</p>
                        <p className="text-destructive/85 text-xs leading-relaxed">{errorMessage}</p>
                    </div>
                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-destructive underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
                        >
                            {t('checkout', 'tryAgain')}
                        </button>
                    )}
                </div>
            )}

            <button
                type="button"
                onClick={onSubmit}
                disabled={buttonDisabled}
                aria-describedby={isError && errorMessage ? errorId : undefined}
                aria-busy={isBusy}
                data-state={state}
                data-shake={shake ? "true" : "false"}
                className={cn(
                    "checkout-cta group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl px-6 text-base font-semibold text-primary-foreground shadow-[0_8px_24px_-12px_rgba(30,122,58,0.55)] transition-[transform,box-shadow,background-color] duration-150 ease-out",
                    "bg-primary hover:bg-primary/95 active:scale-[0.985]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:active:scale-100",
                    isDone && "bg-primary",
                    isBusy && "cursor-wait",
                    "motion-reduce:transition-none motion-reduce:active:scale-100",
                )}
            >
                <span
                    aria-hidden
                    className={cn(
                        "pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700",
                        "group-hover:translate-x-full motion-reduce:hidden",
                        buttonDisabled && "group-hover:translate-x-full",
                    )}
                />

                {isBusy && (
                    <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />
                )}
                {isDone && (
                    <CheckCircle2
                        className="h-5 w-5 origin-center animate-[scale-in_180ms_ease-out_forwards] motion-reduce:animate-none"
                        aria-hidden
                    />
                )}

                <span className="relative truncate">
                    {state === "idle" || state === "error" ? (
                        <span className="inline-flex items-baseline gap-2">
                            <span>{primaryLabel}</span>
                            {amountLabel && (
                                <span className="font-bold tabular-nums">{amountLabel}</span>
                            )}
                        </span>
                    ) : (
                        <span className={cn(state !== "success" && "animate-pulse motion-reduce:animate-none")}>
                            {buttonLabel}
                        </span>
                    )}
                </span>
            </button>

            {helperText && state === "idle" && (
                <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    {helperText}
                </p>
            )}

            <p
                id={statusId}
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {announce}
            </p>

            <style jsx>{`
                @keyframes scale-in {
                    0% {
                        transform: scale(0.6);
                        opacity: 0;
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .checkout-cta[data-shake="true"] {
                    animation: cta-shake 320ms ease-in-out;
                }
                @keyframes cta-shake {
                    0%,
                    100% {
                        transform: translateX(0);
                    }
                    20% {
                        transform: translateX(-6px);
                    }
                    40% {
                        transform: translateX(6px);
                    }
                    60% {
                        transform: translateX(-4px);
                    }
                    80% {
                        transform: translateX(4px);
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .checkout-cta[data-shake="true"] {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
}
