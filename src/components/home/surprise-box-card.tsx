"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Check, Clock, Loader2, MapPin, Plus } from "lucide-react";
import { useLocale } from "@/contexts/locale-context";
import { useImageLoader } from "@/hooks/use-image-loader";
import Link from "next/link";
import { SurpriseBoxComponent } from "@/types";
import { formatMoney, moneyAmount } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { FlyToCart } from "@/components/animation/fly-to-cart";
import { motion } from "framer-motion";

interface SurpriseBoxCardProps {
  box: SurpriseBoxComponent;
}

export function SurpriseBoxCard({ box }: SurpriseBoxCardProps) {
    const {t} = useLocale();
    const {addToCart} = useCart();
    const {toast} = useToast();
    const isAddingRef = useRef(false);
    const [isAdding, setIsAdding] = useState(false);
    const [flyingItem, setFlyingItem] = useState<{
        id: string;
        image: string;
        sourcePosition: { x: number, y: number };
        targetPosition: { x: number, y: number };
    } | null>(null);

    const {src, onError, onLoad} = useImageLoader({
        src: box.image ?? "",
        fallbackSrc: "/images/box-placeholder.jpg",
    });

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isAddingRef.current) return;
        isAddingRef.current = true;
        setIsAdding(true);

        try {
            const fullBox = await api.boxes.getById(box.id);

            if (fullBox) {
                const completeBox = {
                    ...fullBox,
                    price: fullBox.price || 0,
                    storeId: fullBox.storeId || "",
                    storeName: fullBox.storeName || ""
                };

                addToCart(completeBox);

                toast({
                    title: (
                        <span className="flex items-center gap-2.5">
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </span>
                            <span>{t("common", "addedToCart", "Додано до кошика")}</span>
                        </span>
                    ),
                    description: completeBox.name,
                    duration: 2000,
                });

                const buttonRect = e.currentTarget.getBoundingClientRect();
                const sourcePosition = {
                    x: buttonRect.left,
                    y: buttonRect.top
                };

                const targetPosition = {
                    x: window.innerWidth - 70,
                    y: window.innerHeight - 70
                };

                setFlyingItem({
                    id: `${box.id}-${Date.now()}`,
                    image: fullBox.image || "/images/box-placeholder.jpg",
                    sourcePosition,
                    targetPosition
                });

                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }
        } catch (err) {
            toast({
                title: t("common", "error"),
                description: t("common", "addError", "Не вдалося додати — спробуйте ще раз"),
                variant: "destructive",
            });
        } finally {
            isAddingRef.current = false;
            setIsAdding(false);
        }
    };

    const removeFlyingItem = () => {
        setFlyingItem(null);
    };

    return (
        <>
            <Link href={`/box/${box.id}`}>
                <div
                    className="w-64 flex-shrink-0 bg-card dark:bg-card rounded-3xl overflow-hidden shadow-soft-md hover:shadow-soft-lg cursor-pointer hover:-translate-y-1 active:scale-[0.98] transition-[transform,box-shadow] duration-200 ease-organic"
                    style={{ willChange: "transform, opacity" }}
                >
                    <div className="relative h-40 w-full">
                        <Image
                            src={src}
                            alt={box.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                            onError={onError}
                            onLoad={onLoad}
                        />
                        {box.discount && (
                            <div className="absolute top-2.5 left-2.5 bg-accent text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                                -{box.discount}%
                            </div>
                        )}
                        <motion.button
                            className={`absolute bottom-2.5 right-2.5 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_2px_8px_rgba(30,60,30,0.2)] cursor-pointer ${isAdding ? 'opacity-70' : ''}`}
                            whileTap={isAdding ? {} : { scale: 0.85 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleAddToCart(e);
                            }}
                            disabled={isAdding}
                            aria-label={isAdding ? t('common', 'addingToCart') : `${t('common', 'addToCart')}: ${box.name}`}
                            type="button"
                        >
                            {isAdding ? <Loader2 className="h-4 w-4 animate-spin"/> : <Plus className="h-5 w-5"/>}
                        </motion.button>
                    </div>
                    <div className="p-4">
                        <h3 className="font-semibold text-base mb-1 truncate text-foreground">{box.name}</h3>

                        {/* Price row */}
                        {box.price != null && (
                            <div className="flex items-baseline gap-2 mb-1.5">
                                <span className="font-serif text-lg font-bold text-primary tabular-nums">
                                    {formatMoney(box.price)}
                                </span>
                                {box.retailPrice != null && box.price != null && moneyAmount(box.retailPrice) > moneyAmount(box.price) && (
                                    <span className="text-sm text-muted-foreground line-through tabular-nums">
                                        {formatMoney(box.retailPrice)}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                            <span className="flex items-center">
                                <Clock className="w-3.5 h-3.5 mr-1 text-primary/60"/>
                                {box.timeLeft}
                            </span>
                            {box.location && box.location.lat && box.location.lng && (
                                <span className="flex items-center">
                                    <MapPin className="w-3.5 h-3.5 mr-1 text-primary/60"/>
                                    <span className="truncate">{(box as any).distanceKm ? `${(box as any).distanceKm} km` : t('common', 'nearby')}</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Link>

            {flyingItem && (
                <FlyToCart
                    id={flyingItem.id}
                    imageUrl={flyingItem.image}
                    sourcePosition={flyingItem.sourcePosition}
                    targetPosition={flyingItem.targetPosition}
                    onComplete={removeFlyingItem}
                    showConfetti={true}
                />
            )}
        </>
    );
}
