"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { motion, AnimatePresence } from 'framer-motion';

export const CartIndicator = () => {
  const { cartCount, cartTotal } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevCount, setPrevCount] = useState(0);

  // Animate when cart count changes
  useEffect(() => {
    if (cartCount > prevCount) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    setPrevCount(cartCount);
  }, [cartCount, prevCount]);

  if (cartCount === 0) {
    return (
      <Link href="/cart">
        <button 
          className="bg-card shadow-md text-primary rounded-full p-3 flex items-center justify-center hover:bg-primary/5 transition-colors"
          aria-label="View cart"
        >
          <ShoppingBag className="h-6 w-6" />
        </button>
      </Link>
    );
  }

  return (
    <Link href="/cart">
      <button 
        className="cart-indicator bg-primary shadow-md text-white rounded-full p-3 flex items-center justify-center relative hover:bg-primary/90 transition-colors"
        aria-label={`View cart with ${cartCount} items`}
      >
        <ShoppingBag className="h-6 w-6" />
        
        <AnimatePresence>
          <motion.div
            key={`cart-count-${cartCount}`}
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
              scale: isAnimating ? [1, 1.3, 1] : 1,
              opacity: 1
            }}
            transition={{
              duration: isAnimating ? 0.4 : 0.2,
              ease: "easeOut"
            }}
            style={{ willChange: "transform, opacity" }}
          >
            {cartCount}
          </motion.div>
        </AnimatePresence>
      </button>
    </Link>
  );
};