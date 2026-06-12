"use client";

import React, { useEffect, useRef, useState } from "react";
import { Leaf, Search, ShoppingCart, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLocale } from "@/contexts/locale-context";
import { useCart } from "@/contexts/cart-context";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { t } = useLocale();
    const { cartCount } = useCart();
    const { isAuthenticated, requireAuth } = useAuth();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (searchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchOpen]);

    const handleProfileClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!isAuthenticated) {
            e.preventDefault();
            requireAuth();
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
            setSearchQuery("");
        }
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setSearchOpen(false);
            setSearchQuery("");
        }
    };

    return (
        <header
            className={`
                sticky top-0 z-50 mx-4 mt-3
                rounded-2xl px-5 py-3
                flex items-center justify-between
                backdrop-blur-md
                shadow-[0_4px_24px_rgba(30,60,30,0.08)]
                transition-[background-color,box-shadow] duration-300 ease-out
                ${isScrolled
                    ? "bg-background/90"
                    : "bg-background/80"
                }
            `}
        >
            {/* Logo */}
            <Link href="/" className="cursor-pointer group flex items-center gap-2.5">
                <motion.div
                    whileHover={{ rotate: [0, -12, 12, -6, 0] }}
                    transition={{ duration: 0.5 }}
                >
                    <Leaf className="w-6 h-6 text-primary transition-[color,transform] duration-200 ease-out group-hover:scale-110" />
                </motion.div>
                <span className="font-[family-name:var(--font-heading)] font-bold text-xl tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary">
                    FoodWise
                </span>
            </Link>

            {/* Right side actions */}
            <div className="flex items-center gap-1">
                {/* Search */}
                <AnimatePresence>
                    {searchOpen && (
                        <motion.form
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            exit={{ scaleX: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            style={{ transformOrigin: "right", width: 220 }}
                            onSubmit={handleSearchSubmit}
                            className="overflow-hidden"
                        >
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder={t("navigation", "search")}
                                className="
                                    w-full h-9 px-3 rounded-xl
                                    bg-muted/80
                                    text-sm text-foreground
                                    placeholder:text-muted-foreground
                                    !border-0 !border-none !shadow-none
                                    focus:outline-none focus:ring-2 focus:ring-primary/60
                                    transition-colors duration-200
                                "
                            />
                        </motion.form>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => {
                        setSearchOpen(!searchOpen);
                        if (searchOpen) setSearchQuery("");
                    }}
                    className="
                        cursor-pointer p-2 rounded-xl
                        text-muted-foreground
                        hover:text-primary hover:bg-primary/10
                        transition-[color,background-color] duration-200 ease-out
                    "
                    aria-label="Search"
                >
                    {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                </button>

                {/* Cart */}
                <Link
                    href="/cart"
                    aria-label={t("navigation", "cart")}
                    className="
                        cursor-pointer relative p-2 rounded-xl
                        text-muted-foreground
                        hover:text-primary hover:bg-primary/10
                        transition-[color,background-color] duration-200 ease-out
                    "
                >
                    <ShoppingCart className="w-5 h-5" />
                    <AnimatePresence>
                        {cartCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                                className="
                                    absolute -top-0.5 -right-0.5
                                    bg-primary text-white
                                    text-[10px] font-semibold leading-none
                                    min-w-[18px] h-[18px]
                                    flex items-center justify-center
                                    rounded-full
                                    shadow-sm
                                "
                            >
                                {cartCount > 99 ? "99+" : cartCount}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Link>

                {/* Profile */}
                <Link
                    href="/profile"
                    aria-label={t("navigation", "profile")}
                    onClick={handleProfileClick}
                    className="
                        cursor-pointer p-2 rounded-xl
                        text-muted-foreground
                        hover:text-primary hover:bg-primary/10
                        transition-[color,background-color] duration-200 ease-out
                    "
                >
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-4 h-4" />
                    </div>
                </Link>
            </div>
        </header>
    );
}

export default Header;
