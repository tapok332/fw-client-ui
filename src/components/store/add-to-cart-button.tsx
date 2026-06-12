"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ShoppingCart, Plus } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/locale-context';
import { SurpriseBox } from '@/types';
import { FlyToCart } from '@/components/animation/fly-to-cart';

interface AddToCartButtonProps {
    box: SurpriseBox;
    variant?: 'default' | 'secondary' | 'outline';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
    showIcon?: boolean;
    label?: string | React.ReactNode;
}

export const AddToCartButton = ({
                                    box,
                                    variant = 'default',
                                    size = 'default',
                                    className = '',
                                    showIcon = true,
                                    label,
                                }: AddToCartButtonProps) => {
    const { addToCart } = useCart();
    const { toast } = useToast();
    const { t } = useLocale();
    const resolvedLabel = label ?? t('common', 'addToCart');
    const [isAdding, setIsAdding] = useState(false);
    const [flyingItems, setFlyingItems] = useState<{ id: string; image: string; sourcePosition: { x: number; y: number }; targetPosition: { x: number; y: number } }[]>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
        // Prevent double clicks
        if (isAdding) {
            return;
        }

        try {
            setIsAdding(true);

            // Calculate button position for animation
            const buttonRect = buttonRef.current?.getBoundingClientRect();
            const sourcePosition = {
                x: buttonRect ? buttonRect.left + buttonRect.width / 2 : 0,
                y: buttonRect ? buttonRect.top + buttonRect.height / 2 : 0
            };

            // Find cart button position
            const cartButton = document.querySelector('.cart-indicator');
            let targetPosition = { x: window.innerWidth * 0.9, y: window.innerHeight * 0.1 };

            if (cartButton) {
                const cartRect = cartButton.getBoundingClientRect();
                targetPosition = {
                    x: cartRect.left + cartRect.width / 2,
                    y: cartRect.top + cartRect.height / 2
                };
            }

            // Add a unique ID for this flying item
            const flyingItemId = `${box.id}-${Date.now()}`;

            // Add the flying item for animation
            setFlyingItems(prev => [
                ...prev,
                {
                    id: flyingItemId,
                    image: box.image,
                    sourcePosition,
                    targetPosition
                }
            ]);

            // Simulate a delay in adding to cart to let animation complete
            setTimeout(() => {
                // Add to cart
                addToCart(box, 1);
                toast({
                    title: (
                        <span className="flex items-center gap-2.5">
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                                <Check className="h-3.5 w-3.5" strokeWidth={2.5}/>
                            </span>
                            <span>{t('common', 'addedToCart', 'Додано до кошика')}</span>
                        </span>
                    ),
                    description: box.name,
                    duration: 2000,
                });
                // Reset state
                setIsAdding(false);
            }, 400); // Add to cart before animation finishes
        } catch (error) {
            console.error("AddToCartButton: Error adding to cart:", error);
            setIsAdding(false);
        }
    };

    const handleFlyingItemComplete = (id: string) => {
        setFlyingItems(prev => prev.filter(item => item.id !== id));
    };

    return (
        <>
            <Button
                ref={buttonRef}
                variant={variant}
                size={size}
                className={`bg-primary hover:bg-primary/90 ${className}`}
                onClick={handleAddToCart}
                disabled={isAdding}
            >
                {showIcon && <ShoppingCart className="mr-2 h-4 w-4" />}
                {isAdding ? t('common', 'adding') : resolvedLabel}
            </Button>

            {/* Flying items animations */}
            {flyingItems.map(item => (
                <FlyToCart
                    key={item.id}
                    id={item.id}
                    imageUrl={item.image}
                    sourcePosition={item.sourcePosition}
                    targetPosition={item.targetPosition}
                    onComplete={() => handleFlyingItemComplete(item.id)}
                />
            ))}
        </>
    );
};
