"use client";

import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {triggerConfettiAtPosition} from '@/lib/confetti';

interface FlyToCartProps {
    id: string;
    imageUrl: string;
    sourcePosition: { x: number, y: number };
    targetPosition: { x: number, y: number };
    onComplete: () => void;
    showConfetti?: boolean;
    disabled?: boolean;
}

export const FlyToCart: React.FC<FlyToCartProps> = ({
                                                        id,
                                                        imageUrl,
                                                        sourcePosition,
                                                        targetPosition,
                                                        onComplete,
                                                        showConfetti = false,
                                                        disabled = false
                                                    }) => {
    const [isVisible, setIsVisible] = useState(true);
    const itemSize = 70;
    const halfSize = itemSize / 2;
    const animationDuration = 0.8;
    const debugMode = false;

    const [imageSrc, setImageSrc] = useState(imageUrl || "/images/box-placeholder.jpg");
    const imgRef = useRef<HTMLImageElement>(null);

    const positionsRef = useRef({
        source: sourcePosition,
        target: targetPosition,
        final: targetPosition
    });

    const [ready, setReady] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    // If disabled, call onComplete immediately
    useEffect(() => {
        if (disabled) {
            setTimeout(onComplete, 0);
        }
    }, [disabled, onComplete]);

    // Handle window resize to update cart position
    useEffect(() => {
        if (disabled) return;
        const updateCartPosition = () => {
            // Look for cart indicators again on resize
            const cartIndicators = [
                document.querySelector('.cart-indicator'),
                document.querySelector('.cart-button'),
                document.querySelector('[data-cart="true"]'),
                document.querySelector('a[href="/cart"]'),
                document.querySelector('button[aria-label="Shopping Cart"]')
            ];
            
            // Use the first found cart indicator
            const cartButton = cartIndicators.find(el => el !== null);
            
            if (cartButton) {
                const rect = cartButton.getBoundingClientRect();
                positionsRef.current.final = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                };
                
                if (debugMode) {
                    console.log(`Resize: Updated cart position to:`, positionsRef.current.final);
                }
            }
        };
        
        window.addEventListener('resize', updateCartPosition);
        return () => window.removeEventListener('resize', updateCartPosition);
    }, [debugMode]);

    useLayoutEffect(() => {
        if (disabled) return;
        // Look for cart indicator with multiple selectors to ensure we find it
        const cartIndicators = [
            document.querySelector('.cart-indicator'),
            document.querySelector('.cart-button'),
            document.querySelector('[data-cart="true"]'),
            document.querySelector('a[href="/cart"]'),
            document.querySelector('button[aria-label="Shopping Cart"]')
        ];
        
        // Use the first found cart indicator
        const cartButton = cartIndicators.find(el => el !== null);
        
        if (cartButton) {
            const rect = cartButton.getBoundingClientRect();
            positionsRef.current.final = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
    
            if (debugMode) {
                console.log(`Found cart indicator at:`, positionsRef.current.final);
            }
        } else {
            // Fallback to the target position but adjust to a more reasonable location
            // (top-right corner of the screen where cart icons typically are)
            positionsRef.current.final = {
                x: window.innerWidth - 30,
                y: 40 // Near the top of the screen where cart icons typically are
            };
            
            if (debugMode) {
                console.log(`No cart indicator found, using fallback position:`, positionsRef.current.final);
            }
        }
        setReady(true);
    }, [targetPosition, debugMode, disabled]);

    // Image preload with caching mechanism
    useEffect(() => {
        if (disabled) return;
        // Create an image element in memory for preloading
        const preloadImg = new Image();
        
        // Set up handlers before setting src to avoid race conditions
        preloadImg.onload = () => {
            if (debugMode) console.log(`Image preload complete for FlyToCart ${id}`);
            // Cache the image in-memory for faster retrieval
            setImageLoaded(true);
        };
        
        preloadImg.onerror = () => {
            console.warn(`Failed to load image for flying animation: ${imageSrc}, using fallback`);
            setImageSrc("/images/box-placeholder.jpg");
            // Even with fallback, we should mark as loaded
            setImageLoaded(true);
        };
        
        // Check if image is already in browser cache
        const cachedImage = new Image();
        cachedImage.src = imageSrc;
        
        // If image is already loaded from cache (happens instantly)
        if (cachedImage.complete) {
            setImageLoaded(true);
            if (debugMode) console.log(`Image already in cache for FlyToCart ${id}`);
        } else {
            // Not in cache, load it explicitly
            preloadImg.src = imageSrc;
        }

        if (debugMode) {
            console.log(`FlyToCart ${id} mounted with:`, {
                source: sourcePosition,
                target: targetPosition,
                image: imageSrc
            });
        }

        // Set timer to hide the animation and clean up
        const timer = setTimeout(() => {
            setIsVisible(false);

            if (showConfetti) {
                triggerConfettiAtPosition(
                    positionsRef.current.final,
                    {
                        particleCount: 30,
                        spread: 70,
                        startVelocity: 20,
                        colors: ['#4ade80', '#22c55e', '#16a34a', '#15803d'],
                        disableForReducedMotion: true
                    }
                );
            }

            if (debugMode) {
                console.log(`FlyToCart ${id} animation complete`);
            }

            // Add a small delay before calling onComplete to ensure animation finishes
            setTimeout(() => {
                onComplete();
            }, 100);

        }, animationDuration * 1000 + 100);

        return () => clearTimeout(timer);
    }, [id, sourcePosition, targetPosition, imageSrc, showConfetti, onComplete, debugMode, disabled]);

    if (disabled) return null;

    // Calculate more natural arc and path for the animation
    const midX = sourcePosition.x + (positionsRef.current.final.x - sourcePosition.x) / 2;
    // Adjust arc height based on distance for more natural motion
    const distance = Math.sqrt(
        Math.pow(positionsRef.current.final.x - sourcePosition.x, 2) + 
        Math.pow(positionsRef.current.final.y - sourcePosition.y, 2)
    );
    const arcHeight = Math.min(150, distance * 0.3); // Scale arc height with distance, but cap it
    
    // Calculate if item needs to go up or down based on target position
    const goingDown = positionsRef.current.final.y > sourcePosition.y;
    // Adjust midpoint Y based on direction
    const midY = goingDown 
        ? sourcePosition.y + (arcHeight / 2)
        : sourcePosition.y - arcHeight;

    return (
        <AnimatePresence>
            {isVisible && ready && imageLoaded && (
                <div className="fixed top-0 left-0 w-full h-full z-[1000] pointer-events-none"
                     style={{position: 'fixed'}}>
                    {/* Debug overlay (only visible when debugMode is true) */}
                    {debugMode && (
                        <>
                            <div
                                className="absolute bg-red-500 w-2 h-2 rounded-full"
                                style={{
                                    left: sourcePosition.x - 1,
                                    top: sourcePosition.y - 1,
                                    zIndex: 1001
                                }}
                            />
                            <div
                                className="absolute bg-green-500 w-2 h-2 rounded-full"
                                style={{
                                    left: positionsRef.current.final.x - 1,
                                    top: positionsRef.current.final.y - 1,
                                    zIndex: 1001
                                }}
                            />
                        </>
                    )}

                    {/* Animated element with product image */}
                    <motion.div
                        key={`fly-item-${id}`}
                        className="absolute rounded-full overflow-hidden shadow-lg"
                        initial={{
                            x: sourcePosition.x - halfSize,
                            y: sourcePosition.y - halfSize,
                            scale: 1,
                            opacity: 1
                        }}
                        animate={{
                            x: [
                                sourcePosition.x - halfSize,
                                midX - halfSize,
                                positionsRef.current.final.x - halfSize
                            ],
                            y: [
                                sourcePosition.y - halfSize,
                                midY - halfSize,
                                positionsRef.current.final.y - halfSize
                            ],
                            scale: [1, 0.8, 0.3],
                            opacity: [1, 1, 0],
                            rotate: [0, -5, 0] // Slight rotation for more dynamic feeling
                        }}
                        transition={{
                            duration: animationDuration,
                            times: [0, 0.5, 1],
                            ease: [0.23, 1, 0.32, 1]
                        }}
                        style={{
                            width: itemSize,
                            height: itemSize,
                            backgroundColor: 'white',
                            border: '3px solid hsl(var(--primary))',
                            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
                            zIndex: 1000,
                            backgroundImage: `url(${imageSrc})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            willChange: 'transform, opacity'
                        }}
                    >
                        {/* Background image is set in style above for immediate display.
                            Keep the img tag as fallback and for better SEO */}
                        <div className="w-full h-full relative overflow-hidden opacity-0">
                            <img
                                ref={imgRef}
                                src={imageSrc}
                                alt=""
                                aria-hidden="true"
                                className="w-full h-full object-cover absolute inset-0"
                                onError={() => {
                                    if (imgRef.current) {
                                        imgRef.current.src = "/images/box-placeholder.jpg";
                                        // Update the parent background if the image fails
                                        const parent = imgRef.current.closest('.rounded-full') as HTMLElement;
                                        if (parent) {
                                            parent.style.backgroundImage = `url(/images/box-placeholder.jpg)`;
                                        }
                                    }
                                }}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
