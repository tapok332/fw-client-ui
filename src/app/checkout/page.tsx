"use client";
import {useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import Image from "next/image";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Separator} from "@/components/ui/separator";
import {Label} from "@/components/ui/label";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Input} from "@/components/ui/input";
import {ArrowLeft, Banknote, Edit2} from "lucide-react";
import {formatMoney, formatLineTotal, moneyAmount} from "@/lib/utils";
import {api} from "@/lib/api";
import {DEFAULT_LOCATION_LATLNG} from "@/lib/config";
import {AddressForm} from "@/components/address/address-form";
import {AddressFormValues, composeFullAddress} from "@/lib/validation/address-schema";
import {Address, PaymentType, DeliveryType} from "@/types";
import {useCart} from "@/contexts/cart-context";
import {useData} from "@/contexts/data-context";
import Link from "next/link";
import {PaymentMethodTabs, type PaymentMode} from "@/components/checkout/payment-method-tabs";
import {StripePaymentForm, type StripePaymentFormHandle, type ConfirmIntent} from "@/components/checkout/stripe-payment-form";
import {CheckoutCta, type CheckoutCtaState} from "@/components/checkout/checkout-cta";
import {useOrderPaymentPoll} from "@/hooks/use-order-payment-poll";
import {useTranslation} from "@/contexts/locale-context";

export default function CheckoutPageContent() {
    const {cartItems, cartTotal} = useCart();
    const {createOrder} = useData();
    const router = useRouter();
    const {t} = useTranslation();

    // Get the delivery type from the URL if available
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>(
        (searchParams.get('deliveryType') as 'pickup' | 'delivery') || 'pickup'
    );
    const [paymentMode, setPaymentMode] = useState<PaymentMode>("online");
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [promoCode, setPromoCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ctaState, setCtaState] = useState<CheckoutCtaState>("idle");
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const stripeFormRef = useRef<StripePaymentFormHandle>(null);

    const cashEnabled = deliveryType === "pickup";
    useEffect(() => {
        if (!cashEnabled && paymentMode === "cash") {
            setPaymentMode("online");
        }
    }, [cashEnabled, paymentMode]);

    const {poll: pollOrder} = useOrderPaymentPoll();

    // User addresses state
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
    const [selectedAddressId, setSelectedAddressId] = useState(''); // Will be set after loading
    // Sort addresses so that the selected address appears first
    const sortedAddresses = selectedAddressId
        ? [
            ...savedAddresses.filter(addr => addr.id === selectedAddressId),
            ...savedAddresses.filter(addr => addr.id !== selectedAddressId),
        ]
        : savedAddresses;
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [addressesExpanded, setAddressesExpanded] = useState(false);
    // Currently selected address object
    const selectedAddressObj = savedAddresses.find(addr => addr.id === selectedAddressId);
    // Coordinates attached to a newly created/edited address (geocoding stub).
    const [newAddressCoordinates, setNewAddressCoordinates] = useState({
        latitude: DEFAULT_LOCATION_LATLNG.latitude,
        longitude: DEFAULT_LOCATION_LATLNG.longitude
    });
    // Editing address state — AddressForm receives the row via initialValue.
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    // Open the form when an edit is requested.
    useEffect(() => {
        if (editingAddressId) {
            setShowNewAddressForm(true);
            setAddressesExpanded(true);
        }
    }, [editingAddressId]);

    // Get user's geolocation for address coordinates
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setNewAddressCoordinates({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn("Geolocation error:", error);
                    // Keep default coordinates if geolocation fails
                }
            );
        }
    }, []);

    // Fetch user addresses
    useEffect(() => {
        const fetchAddresses = async () => {
            setIsLoadingAddresses(true);
            try {
                const response = await api.addresses.getAll();

                if (response.success && Array.isArray(response.data)) {
                    setSavedAddresses(response.data);
                    if (response.data.length > 0) {
                        // Find default address if exists
                        const defaultAddress = response.data.find(addr => addr.isDefault);
                        if (defaultAddress) {
                            setSelectedAddressId(defaultAddress.id);
                            setDeliveryAddress(defaultAddress.fullAddress);
                        } else {
                            setSelectedAddressId(response.data[0].id);
                            setDeliveryAddress(response.data[0].fullAddress);
                        }
                    }
                } else {
                    console.error("Invalid response format:", response);
                    setSavedAddresses([]);
                }
            } catch (error) {
                console.error("Failed to fetch addresses:", error);
                // Set empty state in case of error
                setSavedAddresses([]);
            } finally {
                setIsLoadingAddresses(false);
            }
        };

        fetchAddresses();
    }, []);

    // Restore previous checkout details if returning from a failed checkout
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedDetails = sessionStorage.getItem('checkout_details');
            if (savedDetails) {
                try {
                    const details = JSON.parse(savedDetails);
                    if (details.deliveryType) setDeliveryType(details.deliveryType);
                    if (details.paymentMode === "online" || details.paymentMode === "cash") {
                        setPaymentMode(details.paymentMode);
                    }
                    if (details.deliveryAddress) setDeliveryAddress(details.deliveryAddress);
                } catch (e) {
                    console.error("Error parsing saved checkout details", e);
                }
            }
        }
    }, []);

    // Update delivery address when a saved address is selected. The 'new' option
    // has no address until AddressForm saves it (which then selects it by id).
    useEffect(() => {
        if (selectedAddressId && selectedAddressId !== 'new') {
            const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);
            if (selectedAddress) {
                setDeliveryAddress(selectedAddress.fullAddress);
            }
        }
    }, [selectedAddressId, savedAddresses]);

    // Function to request user's current location
    const updateUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setNewAddressCoordinates({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn("Failed to get location:", error);
                    alert(t('checkout', 'geolocationFailedFallback'));
                }
            );
        } else {
            alert(t('checkout', 'geolocationNotSupportedShort'));
        }
    };

    // Persist a new or edited address. AddressForm has already validated the
    // input and owns the loading/error UI — it awaits this and surfaces a toast
    // if it throws.
    const handleSaveAddress = async (values: AddressFormValues) => {
        const addressData: Partial<Address> = {
            ...values,
            coordinates: newAddressCoordinates,
            fullAddress: composeFullAddress(values),
        };
        if (editingAddressId) {
            addressData.id = editingAddressId;
        }
        const response = editingAddressId
            ? await api.addresses.update(addressData as Address)
            : await api.addresses.create(addressData as Address);
        if (!response.success || !response.data) {
            throw new Error(response.message || 'Failed to save address');
        }
        const updated = response.data;
        setSavedAddresses(prev => editingAddressId
            ? prev.map(addr => addr.id === editingAddressId ? updated : addr)
            : [...prev, updated]);
        setSelectedAddressId(updated.id);
        setDeliveryAddress(updated.fullAddress);
        setShowNewAddressForm(false);
        setEditingAddressId(null);
    };

    // If cart is empty, redirect to cart page
    if (cartItems.length === 0) {
        if (typeof window !== "undefined") {
            router.push("/cart");
        }
        return null;
    }

    const validateDelivery = (): string | null => {
        if (deliveryType !== 'delivery') return null;
        if (isLoadingAddresses) return t('checkout', 'waitForAddressesLoading');
        // 'new' means the form is open but the address has not been saved yet.
        if (selectedAddressId === 'new') return t('checkout', 'provideDeliveryAddress');
        if (savedAddresses.length === 0) return t('checkout', 'addDeliveryAddress');
        if (!deliveryAddress.trim()) return t('checkout', 'selectDeliveryAddress');
        return null;
    };

    const buildOrderPayload = (paymentType: PaymentType) => {
        const orderItems = cartItems.map(item => ({
            surpriseBoxId: item.boxId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
        }));
        const backendDeliveryType = deliveryType === 'pickup' ? DeliveryType.PICKUP : DeliveryType.DELIVERY;

        let addressTitle = '';
        if (selectedAddressId !== 'new') {
            const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);
            if (selectedAddress) addressTitle = selectedAddress.title;
        }

        if (typeof window !== 'undefined') {
            sessionStorage.setItem('checkout_details', JSON.stringify({
                deliveryType,
                deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : null,
                addressTitle: addressTitle || null,
                paymentMode,
            }));
        }

        return {
            storeId: cartItems.length > 0 ? cartItems[0].storeId : "",
            items: orderItems,
            paymentType,
            deliveryType: backendDeliveryType,
            deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : null,
        } as any;
    };

    // Called by StripePaymentForm at submit-time: creates order + returns Stripe clientSecret.
    const requestStripeIntent = async (): Promise<ConfirmIntent | { error: string }> => {
        try {
            const response = await api.orders.create(buildOrderPayload(PaymentType.STRIPE));
            const payload = response?.data;
            if (!payload?.order?.id) {
                return { error: t('checkout', 'failedToCreateOrder') };
            }
            if (!payload.paymentClientSecret) {
                return { error: t('checkout', 'paymentSessionNoSecret') };
            }
            return { clientSecret: payload.paymentClientSecret, orderId: payload.order.id };
        } catch (err) {
            // Never surface raw technical errors (e.g. "API error: 503") to the user — log for devs, show a friendly message.
            console.error('Stripe intent request failed:', err);
            return { error: t('checkout', 'serverCommunicationError') };
        }
    };

    const handleSubmitOrder = async () => {
        if (!termsAccepted) return;
        const deliveryError = validateDelivery();
        if (deliveryError) {
            alert(deliveryError);
            return;
        }

        setPaymentError(null);
        setIsSubmitting(true);

        try {
            if (paymentMode === 'cash') {
                setCtaState('submitting');
                const response = await api.orders.create(buildOrderPayload(PaymentType.CASH));
                const orderId = response?.data?.order?.id;
                if (orderId) {
                    setCtaState('success');
                    router.push(`/checkout/confirmation?id=${orderId}`);
                } else {
                    setPaymentError(t('checkout', 'failedToCreateOrder'));
                    setCtaState('error');
                }
                return;
            }

            // Online (Stripe) path — StripePaymentForm orchestrates: validate → create order → confirm payment.
            if (!stripeFormRef.current) {
                setPaymentError(t('checkout', 'paymentFormNotReady'));
                setCtaState('error');
                return;
            }
            setCtaState('submitting');
            const result = await stripeFormRef.current.submit();
            if (!result.ok || !result.orderId) {
                setPaymentError(result.error ?? t('checkout', 'paymentDidNotGoThrough'));
                setCtaState('error');
                return;
            }

            // Poll backend until webhook marks order PAID.
            const pollResult = await pollOrder(result.orderId);
            if (pollResult.ok) {
                setCtaState('success');
                router.push(`/checkout/confirmation?id=${result.orderId}`);
            } else if (pollResult.reason === 'timeout') {
                // Soft success: backend may still confirm via webhook. Send user to confirmation page which polls on its own.
                setCtaState('success');
                router.push(`/checkout/confirmation?id=${result.orderId}`);
            } else {
                // Localize by reason: 'network' carries no copy from the hook; 'failed' may carry a backend failure reason.
                const friendlyMessage = pollResult.reason === 'network'
                    ? t('checkout', 'serverCommunicationError')
                    : pollResult.message ?? t('checkout', 'paymentNotConfirmed');
                setPaymentError(friendlyMessage);
                setCtaState('error');
            }
        } catch (error) {
            // Technical detail to the console only; the user gets a friendly, actionable message.
            console.error("Failed to create order:", error);
            setPaymentError(t('checkout', 'serverCommunicationError'));
            setCtaState('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const computedCtaState: CheckoutCtaState = ctaState;

    const primaryLabel = paymentMode === 'cash' ? t('checkout', 'confirmOrder') : t('checkout', 'payButton');
    const amountLabel = paymentMode === 'cash' ? '' : formatMoney(cartTotal);
    const ctaDisabled = !termsAccepted || isSubmitting || moneyAmount(cartTotal) <= 0;

    return (
        <div className="container px-4 pb-32 md:px-0 md:pb-10">
            {/* Back button and title in a flex row */}
            <div className="flex items-center mt-6 mb-4">
                <button
                    onClick={() => router.push("/cart")}
                    className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer"
                    aria-label={t('common', 'back')}
                >
                    <ArrowLeft className="w-5 h-5 text-foreground"/>
                </button>
                <h1 className="text-2xl font-bold ml-4 font-[family-name:var(--font-heading)]">{t('checkout', 'title')}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cart items list */}
                <div className="md:col-span-2">
                    {/* Delivery method */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>{t('checkout', 'deliveryMethod')}</CardTitle>
                            <p className="text-muted-foreground text-sm">{t('checkout', 'deliveryMethodDescription')}</p>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup
                                value={deliveryType}
                                onValueChange={(value) => setDeliveryType(value as 'pickup' | 'delivery')}
                                className="space-y-3"
                            >
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setDeliveryType('pickup')}
                                    onKeyDown={(e) => {
                                        if (e.key === ' ' || e.key === 'Enter') {
                                            e.preventDefault();
                                            setDeliveryType('pickup');
                                        }
                                    }}
                                    className={`flex items-center justify-between rounded-2xl border p-4 transition-all cursor-pointer ${deliveryType === "pickup" ? "border-primary bg-primary/5 shadow-[0_2px_8px_rgba(30,60,30,0.06)]" : "hover:border-primary/30"}`}>
                                    <div className="flex items-center space-x-3">
                                        <RadioGroupItem value="pickup" id="pickup"/>
                                        <div className="w-8 h-5 flex items-center justify-center">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                                 xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M13 11L21.2 2.8M22 6.8V2H17.2M11 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V13"
                                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                                                    strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <Label htmlFor="pickup" className="font-medium">{t('checkout', 'pickupAtStore')}</Label>
                                    </div>
                                    <span className="text-sm text-primary font-medium">{t('checkout', 'free')}</span>
                                </div>

                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setDeliveryType('delivery')}
                                    onKeyDown={(e) => {
                                        if (e.key === ' ' || e.key === 'Enter') {
                                            e.preventDefault();
                                            setDeliveryType('delivery');
                                        }
                                    }}
                                    className={`flex items-center justify-between rounded-2xl border p-4 transition-all cursor-pointer ${deliveryType === "delivery" ? "border-primary bg-primary/5 shadow-[0_2px_8px_rgba(30,60,30,0.06)]" : "hover:border-primary/30"}`}>
                                    <div className="flex items-center space-x-3">
                                        <RadioGroupItem value="delivery" id="delivery"/>
                                        <div className="w-8 h-5 flex items-center justify-center">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                                 xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                                                    stroke="currentColor" strokeWidth="1.5"/>
                                                <path d="M8.5 12H15.5" stroke="currentColor" strokeWidth="1.5"
                                                      strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M12.5 9L15.5 12L12.5 15" stroke="currentColor"
                                                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <Label htmlFor="delivery" className="font-medium">{t('checkout', 'courierDelivery')}</Label>
                                    </div>
                                    <span className="text-sm text-muted-foreground">{t('checkout', 'deliveryByRates')}</span>
                                </div>
                            </RadioGroup>

                            {deliveryType === 'delivery' && (
                                <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                                    <div className="space-y-4">
                                        <p className="text-sm font-medium text-foreground">{t('checkout', 'deliveryAddress')}</p>

                                        {isLoadingAddresses ? (
                                            // Loading skeleton for addresses
                                            <div className="space-y-3">
                                                {[1, 2].map((i) => (
                                                    <div key={i}
                                                         className="flex items-start p-3 rounded-lg border border-border animate-pulse">
                                                        <div className="w-4 h-4 rounded-full bg-muted mt-1"></div>
                                                        <div className="ml-3 space-y-2 w-full">
                                                            <div className="h-4 bg-muted rounded w-1/3"></div>
                                                            <div className="h-3 bg-muted rounded w-3/4"></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <>
                                                {!addressesExpanded && savedAddresses.length > 0 ? (
                                                    <div
                                                        onClick={() => setAddressesExpanded(true)}
                                                        className="p-3 rounded-lg border border-border cursor-pointer"
                                                    >
                                                        <p className="font-medium break-words">{selectedAddressObj?.title}</p>
                                                        <p className="text-sm text-muted-foreground break-words">{deliveryAddress}</p>
                                                        <p className="text-sm text-muted-foreground mt-0.5">{t('checkout', 'clickToChange')}</p>
                                                    </div>
                                                ) : (
                                                    /* Address selection */
                                                    <RadioGroup
                                                        value={selectedAddressId}
                                                        onValueChange={(value) => {
                                                            setSelectedAddressId(value);
                                                            setShowNewAddressForm(value === 'new');
                                                            // Collapse back to single-address view for saved addresses
                                                            if (value !== 'new') {
                                                                setAddressesExpanded(false);
                                                            }
                                                        }}
                                                        className="space-y-2"
                                                    >
                                                        {savedAddresses.length === 0 ? (
                                                            <div
                                                                className="p-3 rounded-lg border border-border text-center">
                                                                <p className="text-sm text-muted-foreground">{t('checkout', 'noSavedAddresses')}</p>
                                                            </div>
                                                        ) : (
                                                            sortedAddresses.map((address) => (
                                                                <div
                                                                    key={address.id}
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    className={`flex items-start p-3 rounded-lg border ${selectedAddressId === address.id ? 'border-primary bg-primary/5' : 'border-border'} cursor-pointer hover:shadow-md transition-shadow duration-200`}
                                                                    onClick={() => {
                                                                      if (address.id === selectedAddressId) {
                                                                        setAddressesExpanded(false);
                                                                      } else {
                                                                        setSelectedAddressId(address.id);
                                                                        setShowNewAddressForm(false);
                                                                        setAddressesExpanded(false);
                                                                      }
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                      if (e.key === ' ' || e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        (e.currentTarget as HTMLElement).click();
                                                                      }
                                                                    }}
                                                                >
                                                                    <RadioGroupItem value={address.id}
                                                                                    id={`address-${address.id}`}
                                                                                    className="mt-1"/>
                                                                    <div className="ml-3 min-w-0">
                                                                        <Label htmlFor={`address-${address.id}`}
                                                                               className="font-medium break-words">{address.title}</Label>
                                                                        <p className="text-sm text-muted-foreground mt-0.5 break-words">{address.fullAddress}</p>
                                                                    </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingAddressId(address.id);
                                                                    }}
                                                                    className="ml-auto p-2 rounded-lg hover:bg-muted"
                                                                    aria-label={t('checkout', 'editAddressAria')}
                                                                >
                                                                    <Edit2 className="w-5 h-5 text-primary" />
                                                                </button>
                                                                </div>
                                                            ))
                                                        )}
                                                        {/* Add new address option */}
                                                        <div
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() => {
                                                                setSelectedAddressId('new');
                                                                setShowNewAddressForm(true);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === ' ' || e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    (e.currentTarget as HTMLElement).click();
                                                                }
                                                            }}
                                                            className={`flex items-start p-3 rounded-lg border border-dashed cursor-pointer hover:shadow-md transition-shadow duration-200 ${selectedAddressId === 'new' ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'}`}>
                                                            <RadioGroupItem value="new" id="address-new"
                                                                            className="mt-1"/>
                                                            <div className="ml-3">
                                                                <Label htmlFor="address-new" className="font-medium">{t('checkout', 'addNewAddress')}</Label>
                                                                <p className="text-sm text-muted-foreground mt-0.5">{t('checkout', 'enterNewAddress')}</p>
                                                            </div>
                                                        </div>
                                                    </RadioGroup>
                                                )}
                                            </>
                                        )}

                                        {/* New address form — shared AddressForm with client-side validation */}
                                        {showNewAddressForm && (
                                          <div className="mt-4">
                                            <AddressForm
                                              // Remount on add/edit switch so initialValue is re-applied.
                                              key={editingAddressId ?? 'new'}
                                              onSubmit={handleSaveAddress}
                                              onCancel={() => {
                                                setShowNewAddressForm(false);
                                                setEditingAddressId(null);
                                                // Leaving the 'new' option without saving would block
                                                // checkout, so fall back to the first saved address.
                                                if (selectedAddressId === 'new') {
                                                  setSelectedAddressId(savedAddresses[0]?.id ?? '');
                                                }
                                              }}
                                              initialValue={editingAddressId ? savedAddresses.find(a => a.id === editingAddressId) : undefined}
                                              isEditing={!!editingAddressId}
                                              showDefaultToggle
                                              showPreview
                                            />
                                          </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>{t('checkout', 'itemsCount')} ({cartItems.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                {cartItems.map((item) => (
                                    <li key={item.boxId} className="flex gap-4 py-2">
                                        <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="font-medium">{item.name}</h3>
                                            <p className="text-muted-foreground text-sm">{item.storeName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">{item.quantity} x {formatMoney(item.price)}</p>
                                            <p className="font-semibold">{formatLineTotal(item.price, item.quantity)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Payment method */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>{t('checkout', 'paymentMethod')}</CardTitle>
                            <p className="text-muted-foreground text-sm">{t('checkout', 'paymentMethodDescription')}</p>
                        </CardHeader>
                        <CardContent>
                            <PaymentMethodTabs
                                value={paymentMode}
                                onValueChange={(v) => {
                                    setPaymentMode(v);
                                    setPaymentError(null);
                                    setCtaState("idle");
                                }}
                                cashEnabled={cashEnabled}
                                cashDisabledReason={t('checkout', 'cashOnlyForPickup')}
                                onlineContent={
                                    <StripePaymentForm
                                        ref={stripeFormRef}
                                        amount={moneyAmount(cartTotal)}
                                        currency="uah"
                                        locale="uk"
                                        returnUrl={typeof window !== "undefined" ? `${window.location.origin}/checkout/confirmation` : "/checkout/confirmation"}
                                        onConfirmRequest={requestStripeIntent}
                                        onAuthorizing={() => setCtaState("authorizing")}
                                        onError={(msg) => {
                                            setPaymentError(msg);
                                            setCtaState("error");
                                        }}
                                    />
                                }
                                cashContent={
                                    <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                                        <Banknote className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
                                        <div className="text-sm">
                                            <p className="font-semibold text-foreground">{t('checkout', 'payOnReceipt')}</p>
                                            <p className="mt-1 text-muted-foreground">
                                                {t('checkout', 'payOnReceiptDescription')}
                                            </p>
                                        </div>
                                    </div>
                                }
                            />
                        </CardContent>
                    </Card>

                    {/* Promo code (desktop only) */}
                    <div className="hidden md:block">
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>{t('checkout', 'promoCode')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={t('checkout', 'enterPromoCode')}
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                        className="flex-grow"
                                    />
                                    <Button variant="outline">{t('checkout', 'apply')}</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Order summary */}
                <div>
                    <Card className="sticky top-4">
                        <CardHeader>
                            <CardTitle>{t('cart', 'orderInfo')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('confirmation', 'subtotal')}</span>
                                    <span className="font-medium">{formatMoney(cartTotal)}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('checkout', 'delivery')}</span>
                                    <span className="font-medium">
                                        {deliveryType === 'pickup'
                                            ? <span className="flex items-center">
                                                <span
                                                    className="inline-block w-2 h-2 rounded-full bg-primary mr-1.5"></span>
                                                {t('checkout', 'pickupFree')}
                                              </span>
                                            : <span>{t('checkout', 'courierDelivery')}</span>}
                                    </span>
                                </div>

                                {deliveryType === 'delivery' && (
                                    <div className="flex justify-between text-sm pt-1">
                                        <span className="text-muted-foreground">{t('checkout', 'addressLabel')}</span>
                                        <span className="font-medium text-right">{deliveryAddress}</span>
                                    </div>
                                )}

                                {/* Promo code (mobile only) */}
                                <div className="md:hidden">
                                    <div className="flex gap-2 mt-4">
                                        <Input
                                            placeholder={t('checkout', 'enterPromoCode')}
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value)}
                                            className="flex-grow"
                                        />
                                        <Button variant="outline" className="shrink-0">{t('checkout', 'applyShort')}</Button>
                                    </div>
                                </div>

                                <Separator/>

                                <div className="flex justify-between">
                                    <span className="font-semibold">{t('checkout', 'total')}</span>
                                    <span className="font-bold text-lg">{formatMoney(cartTotal)}</span>
                                </div>

                                <div className="flex items-start space-x-2 py-2 mt-2 bg-muted/50 p-3 rounded-lg">
                                    <Checkbox
                                        id="terms"
                                        checked={termsAccepted}
                                        onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                                        className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                    <Label
                                        htmlFor="terms"
                                        className="text-sm leading-tight text-muted-foreground"
                                    >
                                        {t('checkout', 'iAccept')}{" "}
                                        <Link href="/terms" className="text-primary hover:underline">{t('checkout', 'termsOfService')}</Link>
                                        {" "}{t('checkout', 'and')}{" "}
                                        <Link href="/privacy" className="text-primary hover:underline">{t('checkout', 'privacyPolicy')}</Link>
                                    </Label>
                                </div>

                                <div className="hidden md:block">
                                    <CheckoutCta
                                        state={computedCtaState}
                                        amountLabel={amountLabel}
                                        primaryLabel={primaryLabel}
                                        helperText={t('checkout', 'protectedPayment')}
                                        errorMessage={paymentError}
                                        disabled={ctaDisabled}
                                        onSubmit={handleSubmitOrder}
                                        onRetry={() => {
                                            setPaymentError(null);
                                            setCtaState("idle");
                                        }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Mobile sticky CTA */}
            <div className="md:hidden">
                <CheckoutCta
                    sticky
                    state={computedCtaState}
                    amountLabel={amountLabel}
                    primaryLabel={primaryLabel}
                    helperText={ctaState === "idle" ? t('checkout', 'protectedPayment') : undefined}
                    errorMessage={paymentError}
                    disabled={ctaDisabled}
                    onSubmit={handleSubmitOrder}
                    onRetry={() => {
                        setPaymentError(null);
                        setCtaState("idle");
                    }}
                />
            </div>
        </div>
    );
}
