"use client";

import {useState, useEffect, useMemo, Suspense} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {useQuery} from "@tanstack/react-query";
import Image from "next/image";
import {useAuth} from "@/contexts/auth-context";
import {useOrderQuery} from "@/lib/queries/order-queries";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";
import {ArrowLeft, CheckCircle2, ChevronRight, Clock, Copy, CreditCard, Leaf, MapPin, AlertCircle, Loader2, XCircle} from "lucide-react";
import {formatCurrency, formatMoney, formatLineTotal} from "@/lib/utils";
import {api} from "@/lib/api";
import {Order, OrderStatus, PaymentType, DeliveryType, SurpriseBox} from "@/types";
import {motion, useReducedMotion} from "framer-motion";
import {useLocale} from "@/contexts/locale-context";

// Inline SVG data URI — self-contained fallback (the shipped /images/placeholder-food.jpg is a 0-byte file).
// On-brand: warm cream background + forest-green leaf motif. Never 404s.
const FOOD_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><rect width='64' height='64' fill='#F0EEE9'/><g transform='translate(20 20)' fill='none' stroke='#1E7A3A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' opacity='0.45'><path d='M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z'/><path d='M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12'/></g></svg>`,
)}`;

// Order item thumbnail with graceful fallback + skeleton — API image URLs can 404.
function ConfirmationItemImage({src, alt}: {src: string; alt: string}) {
    const [imgSrc, setImgSrc] = useState(src || FOOD_PLACEHOLDER);
    const [loaded, setLoaded] = useState(false);
    const isFallback = imgSrc === FOOD_PLACEHOLDER;

    return (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
            {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden="true" />}
            <Image
                src={imgSrc}
                alt={alt}
                fill
                sizes="64px"
                className={`object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setLoaded(true)}
                onError={() => {
                    if (!isFallback) setImgSrc(FOOD_PLACEHOLDER);
                    setLoaded(true);
                }}
                unoptimized={isFallback}
            />
        </div>
    );
}

// Order progress timeline. Data-driven: single render path keeps every node consistent.
function OrderTimeline({order, isPickup}: {order: Order; isPickup: boolean}) {
    const {t} = useLocale();
    const reduceMotion = useReducedMotion();
    const status = (order.status as string)?.toLowerCase() ?? "";

    const placedAt = `${new Date(order.createdAt).toLocaleDateString("uk-UA", {
        day: "numeric",
        month: "long",
    })} ${new Date(order.createdAt).toLocaleTimeString("uk-UA", {
        hour: "2-digit",
        minute: "2-digit",
    })}`;

    // Cancelled is terminal and off the happy path — surface it plainly instead of a fake progress bar.
    if (status === OrderStatus.CANCELLED.toLowerCase()) {
        return (
            <div className="flex items-start gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                    <XCircle className="h-5 w-5" />
                </span>
                <div>
                    <h3 className="font-medium leading-tight text-foreground">{t("confirmation", "statusCancelled")}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{placedAt}</p>
                </div>
            </div>
        );
    }

    const steps = [
        {key: OrderStatus.PENDING, label: t("confirmation", "statusPending"), desc: placedAt},
        {key: OrderStatus.PROCESSING, label: t("confirmation", "statusProcessing"), desc: t("confirmation", "processingDescription")},
        {key: OrderStatus.READY, label: t("confirmation", "statusReady"), desc: isPickup ? t("confirmation", "readyPickup") : t("confirmation", "readyDelivery")},
        {key: OrderStatus.COMPLETED, label: t("confirmation", "statusCompleted"), desc: isPickup ? t("confirmation", "completedPickup") : t("confirmation", "completedDelivery")},
    ];

    const currentIndex = steps.findIndex((s) => s.key.toLowerCase() === status);

    return (
        <ol>
            {steps.map((step, i) => {
                const isCompletedTerminal = step.key === OrderStatus.COMPLETED && i === currentIndex;
                const isDone = i < currentIndex || isCompletedTerminal;
                const isCurrent = i === currentIndex && !isCompletedTerminal;
                const isLast = i === steps.length - 1;
                const connectorDone = i < currentIndex;

                return (
                    <motion.li
                        key={step.key}
                        className="flex gap-4"
                        aria-current={isCurrent ? "step" : undefined}
                        initial={reduceMotion ? false : {opacity: 0, x: -8}}
                        animate={{opacity: 1, x: 0}}
                        transition={{duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: reduceMotion ? 0 : 0.1 + i * 0.08}}
                    >
                        {/* Node + connector */}
                        <div className="flex flex-col items-center">
                            <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                                    isDone
                                        ? "bg-primary text-primary-foreground"
                                        : isCurrent
                                        ? "bg-primary text-primary-foreground ring-4 ring-accent/30"
                                        : "bg-muted text-muted-foreground/40"
                                }`}
                            >
                                {isDone ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                ) : isCurrent ? (
                                    <motion.span
                                        animate={reduceMotion ? undefined : {scale: [1, 1.12, 1]}}
                                        transition={{duration: 1.6, repeat: Infinity, ease: "easeInOut"}}
                                    >
                                        <Clock className="h-5 w-5" />
                                    </motion.span>
                                ) : (
                                    <span className="h-2 w-2 rounded-full bg-current" />
                                )}
                            </span>
                            {!isLast && (
                                <span
                                    className={`my-1 w-0.5 flex-1 rounded-full ${connectorDone ? "bg-primary" : "bg-border"}`}
                                    aria-hidden="true"
                                />
                            )}
                        </div>

                        {/* Label + description */}
                        <div className={isLast ? "pb-0" : "pb-8"}>
                            <h3 className={`font-medium leading-tight ${isDone || isCurrent ? "text-foreground" : "text-muted-foreground/70"}`}>
                                {step.label}
                            </h3>
                            <p className={`mt-0.5 text-sm ${isCurrent ? "text-foreground/80" : isDone ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                                {step.desc}
                            </p>
                        </div>
                    </motion.li>
                );
            })}
        </ol>
    );
}

function OrderConfirmationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id');
    const {isAuthenticated, isLoading: authLoading} = useAuth();
    const {t} = useLocale();

    // Poll the order while it's in flight (stops at a terminal status) so the
    // status timeline updates live instead of looking frozen.
    const {data: order, isLoading, error} = useOrderQuery(orderId ?? "");

    // The order payload omits the store address and per-item images, so fetch the
    // store once and backfill both from it.
    const {data: store} = useQuery({
        queryKey: ["store", order?.storeId],
        queryFn: () => api.stores.getById(order!.storeId).then((r) => r.data),
        enabled: !!order?.storeId,
        staleTime: 5 * 60_000,
    });
    const boxImageMap = useMemo(() => {
        const map: Record<string, string> = {};
        store?.surpriseBoxes?.forEach((b: SurpriseBox) => {
            if (b.id && b.image) map[b.id] = b.image;
        });
        return map;
    }, [store]);
    const resolvedAddress = order?.storeInfo?.address || store?.address || "";

    // Saved address title from checkout (the API doesn't return it).
    const [addressTitle, setAddressTitle] = useState<string | null>(null);
    useEffect(() => {
        if (typeof window === "undefined") return;
        const saved = sessionStorage.getItem("checkout_details");
        if (!saved) return;
        try {
            setAddressTitle(JSON.parse(saved).addressTitle ?? null);
        } catch (e) {
            console.error("Error parsing saved checkout details", e);
        }
    }, []);

    // Redirect unauthenticated users back through login.
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push(`/login?returnUrl=${encodeURIComponent(`/checkout/confirmation?id=${orderId || ''}`)}`);
        }
    }, [authLoading, isAuthenticated, router, orderId]);

    // Helper function to get readable status
    const getStatusLabel = (status: string): string => {
        switch(status) {
            case OrderStatus.PENDING:
            case "pending":
                return t("confirmation", "statusPending");
            case OrderStatus.PROCESSING:
            case "processing":
                return t("confirmation", "statusProcessing");
            case OrderStatus.READY:
            case "ready":
                return t("confirmation", "statusReady");
            case OrderStatus.COMPLETED:
            case "completed":
                return t("confirmation", "statusCompleted");
            case OrderStatus.CANCELLED:
            case "cancelled":
                return t("confirmation", "statusCancelled");
            default:
                return t("confirmation", "statusProcessing");
        }
    };

    // Status pill dot color. Pill chrome stays neutral with dark text for AA contrast;
    // the dot is a supplementary indicator (the text label carries the meaning).
    const getStatusDotColor = (status: OrderStatus | string): string => {
        switch(status) {
            case OrderStatus.COMPLETED:
            case "completed":
                return "bg-primary";
            case OrderStatus.CANCELLED:
            case "cancelled":
                return "bg-destructive";
            default:
                // pending / processing / ready — order is in progress
                return "bg-accent";
        }
    };

    // Get delivery type label
    const getDeliveryTypeLabel = (type: string | undefined): string => {
        if (!type) return t("confirmation", "pickup");

        switch(type) {
            case DeliveryType.PICKUP:
                return t("confirmation", "pickup");
            case DeliveryType.DELIVERY:
                return t("confirmation", "delivery");
            case DeliveryType.EXPRESS_DELIVERY:
                return t("confirmation", "expressDelivery");
            default:
                return t("confirmation", "pickup");
        }
    };

    // Get payment method label and icon
    const getPaymentInfo = (type: string | undefined): { label: string, method: string } => {
        if (!type) return { label: t("confirmation", "cardPayment"), method: "card" };

        switch(type) {
            case PaymentType.CARD:
                return { label: t("confirmation", "cardPayment"), method: "card" };
            case PaymentType.CASH:
                return { label: t("confirmation", "cashPayment"), method: "cash" };
            case PaymentType.STRIPE:
                return { label: t("confirmation", "onlinePayment"), method: "online" };
            default:
                return { label: t("confirmation", "cardPayment"), method: "card" };
        }
    };

    // Format estimated delivery time (2 days from order creation)
    const getEstimatedDelivery = (createdAt: string): string => {
        if (!createdAt) return new Date().toISOString();

        const orderDate = new Date(createdAt);
        orderDate.setDate(orderDate.getDate() + 2);
        return orderDate.toISOString();
    };

    const handleCopyOrderId = () => {
        if (order) {
            navigator.clipboard.writeText(order.id);
        }
    };

    // Show loading state
    if (isLoading || authLoading) {
        return (
            <div className="container flex flex-col items-center justify-center min-h-[50vh] py-12">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-lg text-muted-foreground">{t("confirmation", "loading")}</p>
            </div>
        );
    }

    // Show error state
    if (error || !order) {
        return (
            <div className="container flex flex-col items-center justify-center min-h-[50vh] py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-center">{t("confirmation", "loadError")}</h2>
                <p className="text-muted-foreground mb-6 text-center max-w-md">{!orderId ? t("confirmation", "noOrderId") : ""}</p>
                <Button
                    onClick={() => router.push('/')}
                    className="bg-primary hover:bg-primary/90"
                >
                    {t("confirmation", "backToHome")}
                </Button>
            </div>
        );
    }

    // Map payment and delivery info
    const paymentInfo = getPaymentInfo(order.paymentType as string);
    const deliveryTypeLabel = getDeliveryTypeLabel(order.deliveryType as string);
    const isPickup = order.deliveryType === DeliveryType.PICKUP;
    const estimatedDelivery = getEstimatedDelivery(order.createdAt);
    const statusLower = String(order.status).toLowerCase();
    const inProgress = !["completed", "cancelled"].includes(statusLower);

    return (
        <div className="container px-4 pb-32 md:px-0 md:pb-10">
            {/* Back button and title */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center mt-6 mb-4"
            >
                <button
                    onClick={() => router.push("/")}
                    className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer"
                    aria-label={t("confirmation", "toHome")}
                >
                    <ArrowLeft className="w-5 h-5 text-foreground"/>
                </button>
                <h1 className="text-2xl font-bold ml-4 font-[family-name:var(--font-heading)]">{t("confirmation", "orderPlaced")}</h1>
                <div className="ml-3 px-3 py-1 bg-primary text-primary-foreground text-sm rounded-full flex items-center shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1"/> {t("confirmation", "success")}
                </div>
            </motion.div>

            {/* Success message */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mb-8 flex flex-col items-center text-center py-8 px-4 bg-gradient-to-br from-primary/5 to-emerald-50 dark:from-primary/10 dark:to-emerald-900/10 rounded-2xl shadow-[0_4px_24px_rgba(30,60,30,0.08)] border border-primary/20"
            >
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                    className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4 shadow-[0_4px_16px_rgba(30,122,58,0.3)]"
                >
                    <CheckCircle2 className="w-8 h-8 text-primary-foreground"/>
                </motion.div>
                <h2 className="text-xl font-bold mb-2 text-primary font-[family-name:var(--font-heading)]">{t("confirmation", "thankYou")}</h2>
                <p className="text-muted-foreground max-w-md">
                    {t("confirmation", "orderConfirmed")}
                </p>

                <div className="w-24 h-1 bg-primary/30 rounded-full my-4"></div>
                <div className="flex items-center mt-2 bg-card px-4 py-3 rounded-xl border border-border shadow-sm">
                    <span className="text-muted-foreground mr-2">{t("confirmation", "orderNumber")}</span>
                    <span className="font-semibold text-primary">{order.id}</span>
                    <button
                        onClick={handleCopyOrderId}
                        className="ml-2 p-1.5 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
                        title={t("common", "copy")}
                        aria-label={t("common", "copy")}
                    >
                        <Copy className="w-4 h-4 text-primary"/>
                    </button>
                </div>

                {/* Eco impact — only shown when API returns real data */}
                {order.ecoImpact ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="mt-6 w-full max-w-sm"
                    >
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">{t("confirmation", "ecoImpact")}</p>
                        <div className="flex gap-3">
                            {order.ecoImpact.co2ReducedKg != null && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.4, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                    className="flex-1 bg-primary/10 rounded-xl p-3 text-center"
                                >
                                    <Leaf className="w-5 h-5 text-primary mx-auto mb-1" />
                                    <p className="text-lg font-bold text-primary">{order.ecoImpact.co2ReducedKg} kg</p>
                                    <p className="text-[11px] text-muted-foreground">{t("confirmation", "co2Saved")}</p>
                                </motion.div>
                            )}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.4, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
                                className="flex-1 bg-accent/10 rounded-xl p-3 text-center"
                            >
                                <Leaf className="w-5 h-5 text-accent mx-auto mb-1" />
                                <p className="text-lg font-bold text-accent">{order.items.length}</p>
                                <p className="text-[11px] text-muted-foreground">{t("confirmation", "mealsSaved")}</p>
                            </motion.div>
                            {order.ecoImpact.moneySaved != null && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.4, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
                                    className="flex-1 bg-primary/10 rounded-xl p-3 text-center"
                                >
                                    <Leaf className="w-5 h-5 text-primary mx-auto mb-1" />
                                    <p className="text-lg font-bold text-primary">{formatCurrency(order.ecoImpact.moneySaved)}</p>
                                    <p className="text-[11px] text-muted-foreground">{t("confirmation", "moneySaved")}</p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.6 }}
                        className="flex items-center gap-2 mt-4 px-4 py-2.5 bg-primary/10 rounded-xl"
                    >
                        <Leaf className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-medium">{t("confirmation", "thankYouEco")}</span>
                    </motion.div>
                )}
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Order Timeline */}
                <div className="md:col-span-2">
                    <Card className="mb-6 border-0 shadow-[0_4px_20px_rgba(30,60,30,0.06)] rounded-2xl overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-border">
                            <CardTitle className="flex items-center">
                                <span>{t("confirmation", "orderStatus")}</span>
                                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm font-medium text-foreground shadow-sm">
                                    <span className="relative flex h-2 w-2" aria-hidden="true">
                                        {inProgress && (
                                            <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping ${getStatusDotColor(order.status)}`} />
                                        )}
                                        <span className={`relative inline-flex h-2 w-2 rounded-full ${getStatusDotColor(order.status)}`} />
                                    </span>
                                    {getStatusLabel(order.status)}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <OrderTimeline order={order} isPickup={isPickup} />
                        </CardContent>
                    </Card>

                    {/* Order Items */}
                    <Card className="mb-6 border-0 shadow-[0_4px_20px_rgba(30,60,30,0.06)] rounded-2xl overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-border">
                            <CardTitle>{t("confirmation", "items")} ({order.items.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <ul className="divide-y divide-border">
                                {order.items.map((item) => (
                                    <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                                        <ConfirmationItemImage
                                            src={item.imageUrl || boxImageMap[item.id] || (item.menuItemId ? boxImageMap[item.menuItemId] : "") || FOOD_PLACEHOLDER}
                                            alt={item.name}
                                        />
                                        <div className="flex-grow min-w-0">
                                            <h3 className="font-medium truncate">{item.name}</h3>
                                            <p className="text-muted-foreground text-sm truncate">{order.storeName}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm text-muted-foreground">{item.quantity} x {formatMoney(item.price)}</p>
                                            <p className="font-semibold">{formatLineTotal(item.price, item.quantity)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Order Summary */}
                <div>
                    <div className="space-y-6">
                        <Card className="border-0 shadow-[0_4px_20px_rgba(30,60,30,0.06)] rounded-2xl overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b border-border">
                                <CardTitle>{t("confirmation", "orderInfo")}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {/* Delivery Info */}
                                    <div>
                                        <h3 className="font-semibold mb-2 flex items-center">
                                            <MapPin className="w-4 h-4 mr-2 text-primary"/>
                                            {deliveryTypeLabel}
                                        </h3>
                                        <div className="bg-muted/30 p-3 rounded-lg">
                                            {isPickup ? (
                                                <div>
                                                    <p className="text-foreground">{order.storeName}</p>
                                                    {resolvedAddress && (
                                                        <p className="text-sm text-muted-foreground">{resolvedAddress}</p>
                                                    )}
                                                    {order.pickupCode && (
                                                        <p className="mt-2 text-sm font-medium">
                                                            {t("confirmation", "pickupCode")} <span className="text-primary font-semibold">{order.pickupCode}</span>
                                                        </p>
                                                    )}
                                                    <div className="mt-2 text-xs text-muted-foreground">
                                                        {t("confirmation", "estimatedReady")}
                                                        <span className="font-medium block text-foreground">
                                                            {new Date(estimatedDelivery).toLocaleDateString('uk-UA', {
                                                                day: 'numeric',
                                                                month: 'long'
                                                            })} {new Date(estimatedDelivery).toLocaleTimeString('uk-UA', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-foreground">{t("confirmation", "courierDelivery")}</p>
                                                    {addressTitle && (
                                                        <p className="text-sm font-medium text-muted-foreground">{addressTitle}</p>
                                                    )}
                                                    <p className="text-sm text-muted-foreground">{order.deliveryAddress || t("confirmation", "noAddress")}</p>
                                                    <div className="mt-2 text-xs text-muted-foreground">
                                                        {t("confirmation", "estimatedDelivery")}
                                                        <span className="font-medium block text-foreground">
                                                            {new Date(estimatedDelivery).toLocaleDateString('uk-UA', {
                                                                day: 'numeric',
                                                                month: 'long'
                                                            })} {new Date(estimatedDelivery).toLocaleTimeString('uk-UA', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Payment Info */}
                                    <div>
                                        <h3 className="font-semibold mb-2 flex items-center">
                                            <CreditCard className="w-4 h-4 mr-2 text-primary"/>
                                            {t("confirmation", "payment")}
                                        </h3>
                                        <div className="bg-muted/30 p-3 rounded-lg">
                                            <div className="flex items-center">
                                                {paymentInfo.method === 'card' ? (
                                                    <>
                                                        <Image src="/images/visa.png" alt="VISA" width={32}
                                                               height={20}/>
                                                        <span className="ml-2 text-foreground">•••• 4242</span>
                                                    </>
                                                ) : paymentInfo.method === 'apple' ? (
                                                    <>
                                                        <Image src="/images/apple-pay.png" alt="Apple Pay" width={32}
                                                               height={20}/>
                                                        <span className="ml-2 text-foreground">Apple Pay</span>
                                                    </>
                                                ) : paymentInfo.method === 'google' ? (
                                                    <>
                                                        <Image src="/images/google-pay.png" alt="Google Pay" width={32}
                                                               height={20}/>
                                                        <span className="ml-2 text-foreground">Google Pay</span>
                                                    </>
                                                ) : paymentInfo.method === 'online' ? (
                                                    <>
                                                        <CreditCard className="w-8 h-5 text-primary"/>
                                                        <span className="ml-2 text-foreground">{paymentInfo.label}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-foreground">{paymentInfo.label}</span>
                                                )}

                                                <span
                                                    className="ml-auto bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                                                    {paymentInfo.method === 'cash' ? t("confirmation", "payOnReceive") : t("confirmation", "paid")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator/>

                                    {/* Order Total */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t("confirmation", "subtotal")}</span>
                                            <span className="font-medium">{formatMoney(order.totalPrice)}</span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t("confirmation", "deliveryFee")}</span>
                                            <span className="font-medium">
                                                {isPickup
                                                    ? <span className="flex items-center">
                                                        <span
                                                            className="inline-block w-2 h-2 rounded-full bg-primary mr-1.5"></span>
                                                        {t("confirmation", "free")}
                                                    </span>
                                                    : t("confirmation", "serviceRates")}
                                            </span>
                                        </div>

                                        <Separator/>

                                        <div className="flex justify-between">
                                            <span className="font-semibold">{t("confirmation", "total")}</span>
                                            <span
                                                className="font-bold text-lg">{formatMoney(order.totalPrice)}</span>
                                        </div>

                                        <div className="text-center mt-4">
                                            <span className="text-xs text-primary bg-primary/5 px-2 py-1 rounded-full">
                                                {t("confirmation", "thankYouPlanet")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="space-y-3">
                            <Button
                                variant="default"
                                className="w-full rounded-xl shadow-[0_4px_12px_rgba(30,122,58,0.2)] cursor-pointer"
                                onClick={() => router.push('/')}
                            >
                                {t("confirmation", "backToHome")}
                            </Button>

                            <Button
                                className="w-full border-primary/30 text-primary hover:bg-primary/5 rounded-xl cursor-pointer"
                                variant="outline"
                                onClick={() => router.push('/orders')}
                            >
                                {t("confirmation", "myOrders")}
                                <ChevronRight className="w-4 h-4 ml-1"/>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function OrderConfirmationPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <OrderConfirmationContent />
        </Suspense>
    );
}
