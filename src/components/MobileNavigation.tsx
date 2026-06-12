"use client";

import Link from "next/link";
import {useAuth} from "@/contexts/auth-context";
import {Heart, Home as HomeIcon, ShoppingCart, Store as StoreIcon, User, Utensils} from "lucide-react";
import {usePathname} from "next/navigation";
import {cn} from "@/lib/utils";
import {useLocale} from "@/contexts/locale-context";
import {useCart} from "@/contexts/cart-context";
import {motion, AnimatePresence} from "framer-motion";

export function MobileNavigation() {
    const pathname = usePathname();
    const {requireAuth, isAuthenticated} = useAuth();
    const {t} = useLocale();
    const {cartCount} = useCart();

    // Skip on focused conversion flows: bottom nav competes with sticky CTAs and
    // tempts users to navigate away mid-payment.
    if (pathname.startsWith('/checkout')) {
        return null;
    }

    const handleProfileClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (href === '/profile' && !isAuthenticated) {
            e.preventDefault();
            requireAuth();
        }
    };

    const navItems = [
        {href: "/", icon: HomeIcon, label: t("navigation", "recommendations")},
        {href: "/restaurants", icon: Utensils, label: t("navigation", "restaurants")},
        {href: "/stores", icon: StoreIcon, label: t("navigation", "stores")},
        {href: "/favorites", icon: Heart, label: t("navigation", "favorites")},
        {href: "/cart", icon: ShoppingCart, label: t("navigation", "cart")},
        {href: "/profile", icon: User, label: t("navigation", "profile"), requireAuth: true},
    ];

    return (
        <>
            <nav className="fixed bottom-0 w-full bg-white/90 dark:bg-card/90 backdrop-blur-md shadow-nav-top flex justify-around py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] md:hidden z-40">
                {navItems.map(tab => {
                    const isActive = pathname === tab.href ||
                        (tab.href !== "/" && pathname.startsWith(tab.href));

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className="flex flex-col items-center relative cursor-pointer"
                            onClick={(e) => tab.requireAuth ? handleProfileClick(e, tab.href) : null}
                        >
                            <motion.div
                                className={cn(
                                    "relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-200",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground"
                                )}
                                whileTap={{ scale: 0.85 }}
                                transition={{ duration: 0.1, ease: [0.23, 1, 0.32, 1] }}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.href === "/cart" && cartCount > 0 && (
                                    <AnimatePresence>
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                                            className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-semibold leading-none min-w-[16px] h-[16px] flex items-center justify-center rounded-full shadow-sm tabular-nums"
                                        >
                                            {cartCount > 99 ? "99+" : cartCount}
                                        </motion.span>
                                    </AnimatePresence>
                                )}
                            </motion.div>
                            <span className={cn(
                                "text-[11px] mt-0.5 transition-colors duration-200",
                                isActive
                                    ? "text-primary font-medium"
                                    : "text-muted-foreground"
                            )}>
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
            <div className="h-20 md:hidden"/>
        </>
    );
}
