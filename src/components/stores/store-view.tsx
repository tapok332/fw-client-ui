"use client";

import React, {useEffect, useRef, useState} from "react";
import Image from "next/image";
import {usePathname} from "next/navigation";
import {
    ArrowLeft,
    Check,
    ChevronRight,
    Clock,
    ExternalLink,
    Info,
    MapPin,
    Package,
    Phone,
    Plus,
    Search,
    Share2,
    Star,
    Truck
} from "lucide-react";
import {FavoriteHeartButton} from "@/components/favorites/favorite-heart-button";
import {ScrollArea, ScrollBar} from "@/components/ui/scroll-area";
import {Input} from "@/components/ui/input";
import {useMediaQuery} from "@/hooks/useMediaQuery";
import {useToast} from '@/hooks/use-toast';
import {useLocale} from "@/contexts/locale-context";
import {useCart} from "@/contexts/cart-context";
import {api} from "@/lib/api";
import {defaultStore, ExtendedStoreDetail, Money, SurpriseBox, ZERO_MONEY} from "@/types";
import {formatMoney} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {Separator} from "@/components/ui/separator";
// import {FlyToCart} from "@/components/animation/fly-to-cart";
import {AddToCartButton} from "@/components/store/add-to-cart-button";

export default function StoreView({storeId}: { storeId: string }) {
    const {t} = useLocale();
    const [store, setStore] = useState<ExtendedStoreDetail>(defaultStore);
    const [cartItems, setCartItems] = useState<number>(0);
    const [cartTotal, setCartTotal] = useState<Money>(ZERO_MONEY);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [isSellerInfoOpen, setIsSellerInfoOpen] = useState(false);
    const {toast} = useToast();
    const [searchQuery, setSearchQuery] = useState("");

    const [recommendedBoxes, setRecommendedBoxes] = useState<SurpriseBox[]>([]);

    // Fetch store data from API
    useEffect(() => {
        const fetchStore = async () => {
            try {
                setIsLoading(true);

                // Fetch real data from API
                const storeData = await api.stores.getById(storeId);

                // Debug log to help trace API response format

                if (storeData) {
                    // Create extended store data with surprise boxes property
                    const extendedStoreData: ExtendedStoreDetail = {
                        ...storeData,
                        surpriseBoxes: [],
                        // Map any missing properties needed for the UI
                        workingHours: `${(storeData.opensAt ?? '').slice(0, 5)} - ${(storeData.closesAt ?? '').slice(0, 5)}`,
                        coverImage: storeData.heroUrl,
                        minOrder: storeData.minOrderAmount,
                        deliveryCost: storeData.deliveryFee,
                        // Add contact information (these would come from the API in a real implementation)
                        phone: storeData.phone || undefined,
                        website: storeData.website || undefined
                    };

                    // Debug log for heroUrl

                    // Fetch surprise boxes for this store
                    try {
                        const response = await api.boxes.getByStore(storeId);

                        // Debug log to help trace API response format

                        if (response && Array.isArray(response)) {
                            // Ensure the surprise boxes conform to the expected type
                            const typedSurpriseBoxes: SurpriseBox[] = response.map(box => ({
                                id: box.id || '',
                                name: box.name || '',
                                description: box.description || '',
                                image: box.image || '',
                                price: box.price ?? ZERO_MONEY,
                                retailPrice: box.retailPrice ?? ZERO_MONEY,
                                discount: box.discount || 0,
                                timeLeft: box.timeLeft || '',
                                readableTimeLeft: box.readableTimeLeft || '',
                                stock: box.stock || 0,
                                category: box.category || '',
                                distanceKm: box.distanceKm || 0,
                                pickup: box.pickup || {from: '', to: ''},
                                deliveryAvailable: box.deliveryAvailable || false,
                                rating: box.rating || 0,
                                storeId: box.storeId || storeId,
                                storeName: box.storeName || store.name,
                                storeImage: box.storeImage || store.logoUrl
                            }));

                            extendedStoreData.surpriseBoxes = typedSurpriseBoxes;
                        }
                    } catch (boxError) {
                        console.error("Failed to fetch surprise boxes:", boxError);
                        // Continue with store data even if surprise boxes fail to load
                    }

                    // Fetch recommended surprise boxes
                    try {
                        const recResponse = await api.boxes.getRecommended(storeId);
                        if (Array.isArray(recResponse)) {
                            const typedRec: SurpriseBox[] = recResponse.map(box => ({
                                id: box.id || '',
                                name: box.name || '',
                                description: box.description || '',
                                image: box.image || '',
                                price: box.price ?? ZERO_MONEY,
                                retailPrice: box.retailPrice ?? ZERO_MONEY,
                                discount: box.discount || 0,
                                timeLeft: box.timeLeft || '',
                                readableTimeLeft: box.readableTimeLeft || '',
                                stock: box.stock || 0,
                                category: box.category || '',
                                distanceKm: box.distanceKm || 0,
                                pickup: box.pickup || {from: '', to: ''},
                                deliveryAvailable: box.deliveryAvailable || false,
                                rating: box.rating || 0,
                                storeId: box.storeId || storeId,
                                storeName: box.storeName || store.name,
                                storeImage: box.storeImage || store.logoUrl
                            }));
                            setRecommendedBoxes(typedRec);
                        }
                    } catch (recError) {
                        console.error("Failed to fetch recommended boxes:", recError);
                    }

                    setStore(extendedStoreData);
                }
            } catch (error) {
                console.error("Failed to fetch store data:", error);
                toast({
                    title: t('common', 'error'),
                    description: t('store', 'errorLoadingStore'),
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchStore();
    }, [storeId, toast, t]);

    const {addToCart, cartItems: globalCartItems, cartCount, cartTotal: globalCartTotal} = useCart();

    // Ref to cart indicator for styling/reference
    const cartIndicatorRef = useRef<HTMLDivElement>(null);

    // Sync local cart state with global cart context
    useEffect(() => {
        setCartItems(cartCount);
        setCartTotal(globalCartTotal);
    }, [cartCount, globalCartTotal]);

    const handleAddToCart = (box: SurpriseBox, event: React.MouseEvent) => {
        // Backend now sends prices in the Money wire form (major-unit decimal + ISO code),
        // so no kopeck/cent normalization is needed — pass box.price through unchanged.

        // Create a complete box object with all required cart properties
        // This ensures the cart context has all the required fields
        const completeBox = {
            ...box,
            // Ensure critical fields exist with fallbacks
            id: box.id || `temp-${Date.now()}`,
            name: box.name || "Surprise Box",
            image: box.image || "/images/box-placeholder.jpg",
            storeId: box.storeId || storeId || "",
            storeName: box.storeName || store.name || ""
        };


        try {
            // Add to global cart context with explicit quantity
            addToCart(completeBox, 1);

            toast({
                title: (
                    <span className="flex items-center gap-2.5">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                            <Check className="h-3.5 w-3.5" strokeWidth={2.5}/>
                        </span>
                        <span>{t('common', 'addedToCart', 'Додано до кошика')}</span>
                    </span>
                ),
                description: completeBox.name,
                duration: 2000,
            });
        } catch (error) {
            console.error("Error adding item to cart:", error);
            console.error("Box that caused error:", box);

            // Show error toast
            toast({
                title: t('common', 'error'),
                description: t('store', 'errorAddingToCart'),
                variant: "destructive",
                duration: 3000,
            });
        }
    };

    // Loading skeleton
    if (isLoading) {
        return <StoreViewSkeleton/>;
    }

    return (
        <main className="pb-24 md:pb-0">
            {/* Hero Section */}
            <div className="relative w-screen left-1/2 -translate-x-1/2">
                <div className="relative h-[220px] md:h-[280px] w-full">
                    {store.heroUrl ? (
                        <div className="relative h-full w-full">
                            <Image
                                src={store.heroUrl}
                                alt={store.name}
                                fill
                                sizes="100vw"
                                className="object-cover"
                                priority
                                unoptimized={true}
                                onError={() => {
                                    console.warn('Hero image failed to load, using placeholder');
                                    // We don't set src directly here - we'll use the fallback below
                                }}
                            />
                            {/* Fallback image that shows if the main image fails */}
                            <div className="absolute inset-0 z-[-1]">
                                <Image
                                    src="/images/store-cover-placeholder.jpg"
                                    alt=""
                                    fill
                                    sizes="100vw"
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    ) : (
                        <Image
                            src="/images/store-cover-placeholder.jpg"
                            alt=""
                            fill
                            sizes="100vw"
                            className="object-cover"
                            priority
                        />
                    )}

                    {/* Curved separator */}
                    <div className="absolute bottom-0 left-0 w-full h-[40px] overflow-hidden">
                        <div
                            className="absolute bottom-0 w-[200%] left-[-50%] h-[80px] bg-background rounded-t-[50%/50%] shadow-[0_-4px_16px_rgba(30,60,30,0.06)]"/>
                    </div>
                </div>

                {/* Floating Search Bar */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[85%] flex items-center gap-2">
                    <button
                        onClick={() => window.history.back()}
                        aria-label="Go back"
                        className="rounded-full w-10 h-10 bg-white/80 backdrop-blur flex items-center justify-center shadow-md"
                    >
                        <ArrowLeft className="h-5 w-5"/>
                    </button>

                    <div
                        className="relative flex-grow rounded-full bg-white/80 backdrop-blur shadow-md"
                        onClick={() => setIsSearchVisible(true)}
                    >
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-muted-foreground"/>
                        </div>
                        <Input
                            type="text"
                            placeholder={t('store', 'searchMenu')}
                            className="h-10 pl-9 border-none bg-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <FavoriteHeartButton storeId={storeId} variant="floating" />
                </div>

                {/* Store Logo */}
                <div className="absolute top-[170px] md:top-[220px] left-1/2 -translate-x-1/2">
                    <div
                        className="w-[96px] h-[96px] rounded-2xl shadow-[0_4px_16px_rgba(30,60,30,0.12)] overflow-hidden bg-card border-2 border-primary/30">
                        {store.logoUrl ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={store.logoUrl}
                                    alt={`${store.name} logo`}
                                    width={96}
                                    height={96}
                                    className="object-cover"
                                    unoptimized={true}
                                    onError={() => {
                                        console.warn('Logo image failed to load, using placeholder');
                                        // We don't set src directly here - we'll use the fallback below
                                    }}
                                />
                                {/* Fallback image that shows if the main image fails */}
                                <div className="absolute inset-0 z-[-1]">
                                    <Image
                                        src="/images/store-logo-placeholder.jpg"
                                        alt=""
                                        width={96}
                                        height={96}
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                        ) : (
                            <Image
                                src="/images/store-logo-placeholder.jpg"
                                alt=""
                                width={96}
                                height={96}
                                className="object-cover"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Store Info */}
            <div className="pt-14 px-4 text-center">
                <h1 className="text-2xl md:text-3xl font-semibold">{store.name}</h1>

                <div className="flex flex-col md:flex-row justify-center items-center mt-2 gap-3">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center text-sm md:text-base text-muted-foreground">
                            <Star className="h-4 w-4 md:h-5 md:w-5 fill-yellow-400 text-yellow-400 mr-1"/>
                            <span className="tabular-nums">{(store.rating || 0).toFixed(1)}</span>
                        </div>

                        <div className="flex items-center text-sm md:text-base text-muted-foreground">
                            <Clock className="h-4 w-4 md:h-5 md:w-5 mr-1"/>
                            <span>{store.isOpen ? t('store', 'open') : t('store', 'closed')} · {store.workingHours}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center text-sm md:text-base text-muted-foreground">
                            <span>{t('store', 'minOrder')}: {formatMoney(store.minOrder)}</span>
                        </div>

                        {store.deliveryCost !== undefined && store.deliveryCost !== null ? (
                            <div className="flex items-center text-sm md:text-base text-muted-foreground">
                                <Truck className="h-4 w-4 md:h-5 md:w-5 mr-1"/>
                                <span>{t('store', 'delivery')}: {formatMoney(store.deliveryCost)}</span>
                            </div>
                        ) : (
                            <div className="flex items-center text-sm md:text-base text-muted-foreground">
                                <Package className="h-4 w-4 md:h-5 md:w-5 mr-1"/>
                                <span>{t('store', 'pickup')}</span>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-2 mx-auto hover:text-primary transition-colors"
                    onClick={() => setIsSellerInfoOpen(true)}
                >
                    <Info className="h-4 w-4"/>
                    <span>{t('store', 'sellerInfo')}</span>
                    <ChevronRight className="h-4 w-4"/>
                </button>
            </div>

            {/* Fast-actions Row */}
            <div className="flex items-center justify-center gap-3 mt-4 px-4">
                <button
                    className="rounded-xl border px-4 py-3 flex items-center gap-2 hover:border-primary hover:border-2 transition-all">
                    <span className="text-sm">10–20 {t('common', 'minutes')}</span>
                    <Truck className="h-4 w-4"/>
                </button>

                <button
                    className="rounded-xl border px-4 py-3 flex items-center gap-2 hover:border-primary hover:border-2 transition-all"
                    onClick={() => {
                        if (navigator.share) {
                            navigator.share({
                                title: store.name,
                                text: `${t('store', 'shareText')} ${store.name}`,
                                url: window.location.href,
                            });
                        }
                    }}
                >
                    <span className="text-sm">{t('common', 'share')}</span>
                    <Share2 className="h-4 w-4"/>
                </button>

            </div>

            {/* Promo Cards */}
            {store.promos && store.promos.length > 0 && (
                <div className="mt-6 px-4">
                    <ScrollArea className="w-full [mask-image:linear-gradient(to_right,black_85%,transparent_100%)]">
                        <div className="flex space-x-4 py-2">
                            {store.promos.map((promo, index) => (
                                <div
                                    key={index}
                                    className="flex-shrink-0 bg-brand-light rounded-xl flex items-center p-3 gap-3 border border-border w-[240px] h-[160px] hover:scale-[1.02] hover:-translate-y-0.5 transition-all"
                                    style={{
                                        backgroundColor: promo.bgColor || "#f9f9f9"
                                    }}
                                >
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center"
                                        style={{backgroundColor: promo.accentColor || "#e5e7eb"}}
                                    >
                                        <span className="text-lg">{promo.emoji}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-sm">{promo.title}</h3>
                                        <p className="text-xs text-muted-foreground">{promo.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal"/>
                    </ScrollArea>
                </div>
            )}

            {/* Surprise Boxes Section */}
            <div className="mt-6 px-4">

                {(!store.surpriseBoxes || !Array.isArray(store.surpriseBoxes) || store.surpriseBoxes.length === 0) ? (
                    <EmptyBoxesState t={t}/>
                ) : (
                    <>
                        {/* Recommended Surprise Boxes */}
                        {recommendedBoxes.length > 0 && (
                            <div className="mt-6">
                                <h2 className="text-xl font-semibold mb-3">
                                    {t('store', 'recommended')}
                                </h2>
                                <ScrollArea
                                    className="w-full [mask-image:linear-gradient(to_right,black_85%,transparent_100%)]">
                                    <div className="flex space-x-4 py-2">
                                        {recommendedBoxes.map((box) => (
                                            <div
                                                key={box.id}
                                                className="flex-shrink-0 bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all w-[240px]"
                                            >
                                                <div className="relative h-[120px] w-full">
                                                    <Image
                                                        src={box.image || "/images/box-placeholder.jpg"}
                                                        alt={box.name}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                                <div className="p-3">
                                                    <h3 className="font-medium truncate">{box.name}</h3>
                                                    {box.description && (
                                                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                            {box.description}
                                                        </p>
                                                    )}
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className="font-serif text-primary font-semibold tabular-nums">
                                                            {formatMoney(box.price)}
                                                        </span>
                                                        <Button
                                                            className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 active:bg-primary/80 transition-colors p-0"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleAddToCart(box, e);
                                                            }}
                                                            aria-label={`Add ${box.name} to cart`}
                                                            type="button"
                                                        >
                                                            <Plus className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <ScrollBar orientation="horizontal"/>
                                </ScrollArea>
                            </div>
                        )}
                        {/* All Other Boxes - Desktop */}
                        {store.surpriseBoxes.length > 0 && (
                            <div className="hidden md:block mb-6">
                                <h3 className="text-lg font-medium mb-3 text-foreground">
                                    {t('store', 'allAvailableBoxes')}
                                </h3>

                                <div className="hidden md:grid md:grid-cols-3 gap-6">
                                    {store.surpriseBoxes.map((box) => (
                                        <div key={`desktop-${box.id}`}
                                             className="w-full bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:scale-[1.02] hover:-translate-y-0.5 transition-all">
                                            <div className="w-full h-[120px] relative">
                                                {box.image ? (
                                                    <div className="relative h-full w-full">
                                                        <Image
                                                            src={box.image}
                                                            alt={box.name}
                                                            fill
                                                            className="object-cover"
                                                            unoptimized={true}
                                                            onError={() => {
                                                                console.warn('Box image failed to load, using placeholder');
                                                            }}
                                                        />
                                                        {/* Fallback image */}
                                                        <div className="absolute inset-0 z-[-1]">
                                                            <Image
                                                                src="/images/box-placeholder.jpg"
                                                                alt=""
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Image
                                                        src="/images/box-placeholder.jpg"
                                                        alt=""
                                                        fill
                                                        className="object-cover"
                                                    />
                                                )}
                                                <div
                                                    className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm text-primary text-xs font-medium px-2 py-1 rounded-full">
                                                    {box.discount}% {t('common', 'off')}
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h3 className="font-medium line-clamp-1">{box.name}</h3>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{box.description}</p>
                                                <div className="flex justify-between items-center mt-2">
                                                    <div>
                                                        <p className="font-serif text-primary font-semibold tabular-nums">{formatMoney(box.price)}</p>
                                                        <p className="text-xs text-muted-foreground line-through tabular-nums">{formatMoney(box.retailPrice)}</p>
                                                    </div>
                                                    <Button
                                                        className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 active:bg-primary/80 transition-colors p-0"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleAddToCart(box, e);
                                                        }}
                                                        aria-label={`Add ${box.name} to cart`}
                                                        type="button"
                                                    >
                                                        <Plus className="h-5 w-5"/>
                                                    </Button>
                                                </div>
                                                <div
                                                    className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                                    <div className="flex items-center">
                                                        <Clock className="h-3 w-3 mr-1"/>
                                                        <span>{box.timeLeft.replace('PT', '').replace('H', 'h ').replace('M', 'm')}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="tabular-nums">{box.stock} {t('common', 'left')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All Other Boxes - Mobile */}
                        {store.surpriseBoxes.length > 0 && (
                            <div className="md:hidden">
                                <h3 className="text-lg font-medium mb-3 text-foreground">
                                    {t('store', 'allAvailableBoxes')}
                                </h3>

                                <div className="space-y-4">
                                    {store.surpriseBoxes.map((box) => (
                                        <div key={`mobile-${box.id}`}
                                             className="w-full bg-card rounded-xl overflow-hidden border border-border shadow-sm">
                                            <div className="flex">
                                                <div className="w-1/3 h-[100px] relative">
                                                    <Image
                                                        src={box.image || "/images/box-placeholder.jpg"}
                                                        alt={box.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <div
                                                        className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
                                                        {box.discount}% {t('common', 'off')}
                                                    </div>
                                                </div>
                                                <div className="w-2/3 p-3">
                                                    <h3 className="font-medium line-clamp-1">{box.name}</h3>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{box.description}</p>
                                                    <div className="flex justify-between items-center mt-auto">
                                                        <div>
                                                            <p className="text-primary font-semibold">{formatMoney(box.price)}</p>
                                                            <p className="text-xs text-muted-foreground line-through">{formatMoney(box.retailPrice)}</p>
                                                        </div>
                                                        <Button
                                                            className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 active:bg-primary/80 transition-colors p-0"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleAddToCart(box, e);
                                                            }}
                                                            aria-label={`Add ${box.name} to cart`}
                                                            type="button"
                                                        >
                                                            <Plus className="h-5 w-5"/>
                                                        </Button>
                                                    </div>
                                                    <div
                                                        className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                                                        <div className="flex items-center">
                                                            <Clock className="h-3 w-3 mr-1"/>
                                                            <span>{box.timeLeft.replace('PT', '').replace('H', 'h ').replace('M', 'm')}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <span className="tabular-nums">{box.stock} {t('common', 'left')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Seller Info Dialog */}
            <Dialog open={isSellerInfoOpen} onOpenChange={setIsSellerInfoOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span>{t('store', 'aboutSeller')}</span>
                        </DialogTitle>
                        <DialogDescription>
                            {t('store', 'sellerDetailsInfo')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden relative">
                            {store.logoUrl ? (
                                <div className="relative h-full w-full">
                                    <Image
                                        src={store.logoUrl}
                                        alt={store.name}
                                        fill
                                        className="object-cover"
                                        unoptimized={true}
                                        onError={() => {
                                            console.warn('Seller info logo failed to load, using placeholder');
                                        }}
                                    />
                                    {/* Fallback image */}
                                    <div className="absolute inset-0 z-[-1]">
                                        <Image
                                            src="/images/store-logo-placeholder.jpg"
                                            alt=""
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <Image
                                    src="/images/store-logo-placeholder.jpg"
                                    alt=""
                                    fill
                                    className="object-cover"
                                />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{store.name}</h3>
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1"/>
                                <span className="tabular-nums">{(store.rating || 0).toFixed(1)}</span>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-4"/>

                    {store.description && (
                        <div className="mb-4">
                            <h4 className="font-medium mb-2">{t('store', 'description')}</h4>
                            <p className="text-sm text-muted-foreground">{store.description}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">{t('store', 'details')}</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground"/>
                                    <span>{t('store', 'workingHours')}: {store.workingHours}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4 text-muted-foreground"/>
                                    <span>{t('store', 'minOrder')}: {formatMoney(store.minOrder)}</span>
                                </div>
                                {store.deliveryCost !== undefined && store.deliveryCost !== null ? (
                                    <div className="flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-muted-foreground"/>
                                        <span>{t('store', 'delivery')}: {formatMoney(store.deliveryCost)}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-muted-foreground"/>
                                        <span>{t('store', 'pickup')}</span>
                                    </div>
                                )}
                                {store.address && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5"/>
                                        <span>{t('store', 'address')}: {store.address}</span>
                                    </div>
                                )}
                                {store.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground"/>
                                        <a href={`tel:${store.phone}`} className="text-blue-600">{store.phone}</a>
                                    </div>
                                )}
                                {store.website && (
                                    <div className="flex items-center gap-2">
                                        <ExternalLink className="h-4 w-4 text-muted-foreground"/>
                                        <a
                                            href={store.website.startsWith('http') ? store.website : `https://${store.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600"
                                        >
                                            {store.website}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Debug cart state - remove in production */}
            <div className="hidden">
                Cart state: {cartItems} items, {formatMoney(cartTotal)}
            </div>
        </main>
    );
}

// Empty state for surprise boxes section
const EmptyBoxesState = ({t}: { t: (namespace: string, key: string, defaultValue?: string) => string }) => {
    return (
        <div
            className="rounded-xl border border-border p-8 text-center flex flex-col items-center justify-center bg-muted/50 min-h-[220px]">
            <div className="bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-primary"/>
            </div>
            <h3 className="text-lg font-medium mb-2">{t('store', 'noSurpriseBoxes')}</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
                {t('store', 'noSurpriseBoxesDescription')}
            </p>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.location.reload()}>
                <span>{t('common', 'refresh')}</span>
            </Button>
        </div>
    );
};

// Loading skeleton component for better UX during data fetch
function StoreViewSkeleton() {
    return (
        <div className="relative overflow-hidden">
            <div
                className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="relative h-[220px] md:h-[280px] w-full bg-muted"></div>
            <div className="relative -mt-10 flex justify-center">
                <div className="w-24 h-24 rounded-xl bg-muted"></div>
            </div>
            <div className="pt-10 px-4 text-center">
                <div className="h-8 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="flex justify-center mt-4 gap-2">
                    <div className="h-4 bg-muted rounded w-16"></div>
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                </div>
            </div>
            <div className="mt-6 px-4">
                <div className="flex space-x-4 overflow-x-auto py-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex-shrink-0 bg-muted rounded-xl h-16 w-64"></div>
                    ))}
                </div>
            </div>
            <div className="px-4 mt-6">
                <div className="h-6 bg-muted rounded w-40 mb-4"></div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex gap-3">
                            <div className="w-20 h-20 bg-muted rounded-lg"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                                <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                                <div className="h-4 bg-muted rounded w-1/4 mt-2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
