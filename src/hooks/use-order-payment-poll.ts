"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { PaymentStatus, type Order } from "@/types";

export type OrderPollResult =
    | { ok: true; order: Order; attempts: number }
    | { ok: false; reason: "failed" | "timeout" | "network" | "cancelled"; order?: Order; message?: string; attempts: number };

export interface UseOrderPaymentPollOptions {
    /** Total wallclock budget. Paused while tab hidden. Default 60s (covers 3DS challenge). */
    totalTimeoutMs?: number;
    /** Backoff schedule in ms. Aggressive at start, slow after. */
    schedule?: number[];
    /** ±jitter percent applied to each interval (0–1). Default 0.15 = ±15%. */
    jitter?: number;
}

const TERMINAL_STATUSES = new Set<string>([
    PaymentStatus.PAID,
    PaymentStatus.FAILED,
    PaymentStatus.REFUNDED,
]);

// 95% of payments confirm in first 1.5s after stripe.confirmPayment resolves.
// 3DS / slow webhooks: capped at 5s tail.
// Total: ~25s of polling in worst case (15 attempts → 7 with schedule).
const DEFAULT_SCHEDULE = [400, 800, 1500, 2500, 4000, 5000];

const isBrowser = typeof window !== "undefined";

function applyJitter(ms: number, jitter: number): number {
    if (jitter <= 0) return ms;
    const delta = ms * jitter * (Math.random() * 2 - 1);
    return Math.max(100, Math.round(ms + delta));
}

export function useOrderPaymentPoll({
    totalTimeoutMs = 60_000,
    schedule = DEFAULT_SCHEDULE,
    jitter = 0.15,
}: UseOrderPaymentPollOptions = {}) {
    const [isPolling, setIsPolling] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const cancel = useCallback(() => {
        abortRef.current?.abort();
    }, []);

    useEffect(() => () => abortRef.current?.abort(), []);

    const poll = useCallback(
        async (orderId: string): Promise<OrderPollResult> => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            setIsPolling(true);

            const start = Date.now();
            let activeMs = 0;
            let lastVisibleAt = Date.now();
            let attempts = 0;

            const isHidden = () => isBrowser && document.visibilityState === "hidden";

            const onVisibility = () => {
                if (!isBrowser) return;
                if (document.visibilityState === "visible") {
                    lastVisibleAt = Date.now();
                } else {
                    activeMs += Date.now() - lastVisibleAt;
                }
            };
            if (isBrowser) {
                document.addEventListener("visibilitychange", onVisibility);
            }

            const wait = (ms: number): Promise<void> =>
                new Promise((resolve, reject) => {
                    const t = setTimeout(resolve, ms);
                    controller.signal.addEventListener(
                        "abort",
                        () => {
                            clearTimeout(t);
                            reject(new DOMException("aborted", "AbortError"));
                        },
                        { once: true },
                    );
                });

            try {
                while (!controller.signal.aborted) {
                    if (isHidden()) {
                        // Pause polling while tab hidden — resume on visibility.
                        await wait(500);
                        continue;
                    }

                    // Update active budget (subtract hidden time so 3DS in another tab doesn't burn budget).
                    const currentActive = activeMs + (Date.now() - lastVisibleAt);
                    if (currentActive >= totalTimeoutMs) {
                        return { ok: false, reason: "timeout", message: "Платіж обробляється довше очікуваного", attempts };
                    }

                    attempts++;
                    try {
                        const res = await api.orders.getById(orderId);
                        const order = res?.data;
                        const status = order?.paymentStatus ? String(order.paymentStatus) : undefined;

                        if (status && TERMINAL_STATUSES.has(status)) {
                            if (status === PaymentStatus.PAID) {
                                return { ok: true, order: order!, attempts };
                            }
                            return {
                                ok: false,
                                reason: "failed",
                                order,
                                message: order?.failureMessage ?? "Платіж не пройшов",
                                attempts,
                            };
                        }
                    } catch (err) {
                        // Network blip — let backoff carry us. Only fail at deadline.
                        const elapsed = Date.now() - start;
                        if (elapsed > totalTimeoutMs * 0.95) {
                            // Log the technical detail; the consumer localizes the user-facing copy by reason.
                            console.error("Payment polling network error:", err);
                            return {
                                ok: false,
                                reason: "network",
                                attempts,
                            };
                        }
                    }

                    const baseInterval = schedule[Math.min(attempts - 1, schedule.length - 1)];
                    const interval = applyJitter(baseInterval, jitter);
                    await wait(interval);
                }
                return { ok: false, reason: "cancelled", message: "Polling cancelled", attempts };
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") {
                    return { ok: false, reason: "cancelled", message: "Polling cancelled", attempts };
                }
                throw err;
            } finally {
                if (isBrowser) {
                    document.removeEventListener("visibilitychange", onVisibility);
                }
                setIsPolling(false);
            }
        },
        [totalTimeoutMs, schedule, jitter],
    );

    return { poll, cancel, isPolling };
}
