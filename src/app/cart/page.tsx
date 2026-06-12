"use client";

import {useState} from "react";
import {Info} from "lucide-react";
import {useAuth} from "@/contexts/auth-context";
import {useRouter} from "next/navigation";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";
import Image from "next/image";
import {ArrowLeft, CreditCard, MinusCircle, PlusCircle, ShoppingBag, ShoppingCart, Trash2, Truck} from "lucide-react";
import {formatMoney, formatLineTotal} from "@/lib/utils";
import {MobileNavigation} from "@/components/MobileNavigation";
import {useCart} from "@/contexts/cart-context";
import {AnimatePresence, motion} from "framer-motion";
import {useTranslation} from "@/contexts/locale-context";

function getItemNoun(count: number, t: (s: string, k: string) => string): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return t('cart', 'itemOne');
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return t('cart', 'itemFew');
    return t('cart', 'itemMany');
}

export default function CartPage() {
    const {cartItems, cartTotal, removeFromCart, updateQuantity} = useCart();
    const {requireAuth, isAuthenticated} = useAuth();
    const router = useRouter();
    const {t} = useTranslation();

    const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);

    // Checkout handler - single entry point for all buttons
    const handleCheckout = () => {
        // Check if the user is authenticated
        if (!isAuthenticated) {
            requireAuth();
            return;
        }

        // Navigate to the checkout page, passing the delivery type
        router.push(`/checkout`);
    };

    return (
        <div className="container px-4 pb-32 md:px-6 md:pb-10 mx-auto max-w-7xl">
            {/* Header with back button and title */}
            <div className="flex items-center mt-6 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    aria-label={t('common', 'back')}
                >
                    <ArrowLeft className="w-5 h-5 text-foreground"/>
                </button>
                <h1 className="text-2xl font-bold ml-3 md:ml-4">{t('cart', 'title')}</h1>
            </div>

            {cartItems.length === 0 ? (
                <motion.div
                    initial={{opacity: 0, y: 10}}
                    animate={{opacity: 1, y: 0}}
                    className="flex justify-center mt-10 md:mt-16"
                >
                    <Card
                        className="max-w-md w-full p-6 sm:p-8 md:p-10 text-center shadow-lg border-0 bg-white/80">
                        <div className="flex flex-col items-center gap-5">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                                <ShoppingCart className="w-10 h-10 text-muted-foreground"/>
                            </div>
                            <h2 className="text-2xl font-semibold text-foreground">{t('cart', 'emptyCart')}</h2>
                            <p className="text-muted-foreground mb-2">
                                {t('cart', 'addItemsDescription')}
                            </p>
                            <Button
                                className="bg-primary hover:bg-primary/90 mt-2 py-6 px-8 text-base font-medium relative overflow-hidden group"
                                onClick={() => router.push('/')}
                            >
                                <span
                                    className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-full bg-black/10 group-hover:translate-x-0"></span>
                                <ShoppingBag className="mr-2 h-5 w-5"/>
                                {t('cart', 'viewOffers')}
                            </Button>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-primary/10"></div>
                        <div className="absolute -top-6 -right-6 w-12 h-12 rounded-full bg-primary/10"></div>
                        <div className="absolute top-1/3 right-12 w-4 h-4 rounded-full bg-primary/20"></div>
                    </Card>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-6 md:gap-8">

                    {/* Cart items list */}
                    <div className="lg:col-span-2">
                        <Card className="border-0 shadow-md overflow-hidden relative w-full">
                            <div
                                className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-0"></div>
                            <CardHeader className="bg-muted/50 border-b border-border py-4 relative z-10">
                                <CardTitle className="flex items-center text-foreground">
                                    <div
                                        className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 mr-2">
                                        <ShoppingBag className="w-3.5 h-3.5 text-primary"/>
                                    </div>
                                    {t('cart', 'items')} <span
                                    className="ml-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-sm">
                                        {cartItems.length}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 md:p-6">
                                <ul className="space-y-4 md:space-y-0 md:grid md:grid-cols-1 lg:grid-cols-2 md:gap-5">
                                    <AnimatePresence>
                                        {cartItems.map((item) => (
                                            <motion.li
                                                key={item.boxId}
                                                initial={{opacity: 0, scale: 0.95}}
                                                animate={{opacity: 1, scale: 1}}
                                                exit={{opacity: 0, scale: 0.95}}
                                                transition={{duration: 0.2}}
                                                className="bg-card rounded-xl shadow-sm hover:shadow-md transition-all p-4 flex gap-4 relative border border-border w-full"
                                                layout
                                            >
                                                {/* Item image */}
                                                <div
                                                    className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>

                                                {/* Item info */}
                                                <div className="flex flex-col flex-grow min-w-0">
                                                    <h3 className="font-medium text-lg text-foreground truncate pr-12">{item.name}</h3>
                                                    <p className="text-muted-foreground text-sm mb-auto flex items-center gap-2 min-w-0">
                                                        <span className="flex items-center min-w-0">
                                                            <span className="inline-block w-2 h-2 rounded-full bg-primary/80 mr-1.5 flex-shrink-0"></span>
                                                            <span className="truncate">{item.storeName}</span>
                                                        </span>
                                                    </p>
                                                    <div className="flex justify-between items-center mt-3">
                                                        <div
                                                            className="flex items-center gap-1 bg-muted/50 p-1 rounded-full border border-border">
                                                            <motion.button
                                                                whileTap={{scale: 0.9}}
                                                                onClick={() => updateQuantity(item.boxId, item.quantity - 1)}
                                                                className="p-1.5 rounded-full bg-card shadow-sm hover:bg-muted transition-all border border-border"
                                                                disabled={item.quantity <= 1}
                                                                aria-label={t('cart', 'decreaseQuantity')}
                                                            >
                                                                <MinusCircle
                                                                    className={`h-5 w-5 ${item.quantity <= 1 ? 'text-muted-foreground' : 'text-muted-foreground'}`}/>
                                                            </motion.button>
                                                            <span
                                                                className="font-medium mx-2 w-6 text-center">{item.quantity}</span>
                                                            <motion.button
                                                                whileTap={{scale: 0.9}}
                                                                onClick={() => updateQuantity(item.boxId, item.quantity + 1)}
                                                                className="p-1.5 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
                                                                aria-label={t('cart', 'increaseQuantity')}
                                                            >
                                                                <PlusCircle className="h-5 w-5"/>
                                                            </motion.button>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-muted-foreground text-sm">{formatMoney(item.price)} × {item.quantity}</p>
                                                            <p className="font-bold text-foreground">{formatLineTotal(item.price, item.quantity)}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Remove button with confirmation */}
                                                <div className="absolute top-2 right-2 z-10">
                                                    {showRemoveConfirm === item.boxId ? (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="flex items-center bg-card shadow-md rounded-full px-3 py-1.5 sm:px-3.5 sm:py-2 border border-border"
                                                        >
                                                            <button
                                                                onClick={() => removeFromCart(item.boxId)}
                                                                className="text-red-500 text-xs sm:text-sm font-medium mr-2.5 px-1.5 py-0.5 hover:bg-red-50 rounded-sm transition-colors"
                                                                aria-label={t('cart', 'removeItem')}
                                                            >
                                                                {t('common', 'delete')}
                                                            </button>
                                                            <button
                                                                onClick={() => setShowRemoveConfirm(null)}
                                                                className="text-muted-foreground text-xs sm:text-sm px-1.5 py-0.5 hover:bg-muted rounded-sm transition-colors"
                                                                aria-label={t('cart', 'cancelRemove')}
                                                            >
                                                                {t('common', 'cancel')}
                                                            </button>
                                                                                                                        </motion.div>
                                                    ) : (
                                                        <motion.button
                                                            whileTap={{scale: 0.95}}
                                                            onClick={() => setShowRemoveConfirm(item.boxId)}
                                                            className="p-2 rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                                                            aria-label={t('cart', 'showRemoveOptions')}
                                                        >
                                                            <Trash2
                                                                className="h-4 w-4 md:h-[18px] md:w-[18px]"/>
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order summary (Desktop) */}
                    {cartItems.length > 0 && (
                        <div className="hidden md:block">
                            <motion.div
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                transition={{delay: 0.2}}
                                className="h-full"
                            >
                                <Card className="border-0 shadow-md sticky top-6 w-full">
                                    <CardHeader className="bg-muted/50 border-b border-border py-4">
                                        <CardTitle className="text-foreground">{t('cart', 'orderInfo')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-5">
                                            <div
                                                className="bg-gradient-to-br from-muted/50 to-muted p-5 rounded-lg space-y-3 mt-2 border border-border relative overflow-hidden">
                                                <div
                                                    className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full"></div>

                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">{t('confirmation', 'subtotal')}</span>
                                                    <span
                                                        className="font-medium text-foreground">{formatMoney(cartTotal)}</span>
                                                </div>

                                                <Separator className="bg-border"/>

                                                <div className="flex justify-between pt-1">
                                                    <span className="font-semibold text-foreground">{t('confirmation', 'total')}</span>
                                                    <div className="flex flex-col items-end">
                                                        <span
                                                            className="font-bold text-xl text-primary">{formatMoney(cartTotal)}</span>
                                                        <span
                                                            className="text-xs text-primary">{t('cart', 'savingThePlanet')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {!isAuthenticated && (
                                                <div className="flex items-center gap-2 p-3 mb-3 bg-yellow-50 rounded-lg border border-yellow-100 text-sm">
                                                    <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                    <span className="text-foreground">{t('cart', 'loginRequired')}</span>
                                                </div>
                                            )}

                                            <Button
                                                className="w-full bg-primary hover:bg-primary/90 py-6 shadow-md hover:shadow-lg transition-all text-base font-medium mt-3 group relative overflow-hidden"
                                                onClick={handleCheckout}
                                            >
                                                <span
                                                    className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-full bg-black/10 group-hover:translate-x-0"></span>
                                                <span className="relative flex items-center justify-center">
                                                    {!isAuthenticated ? t('cart', 'loginAndCheckout') : t('cart', 'proceedToCheckout')}
                                                    <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24" fill="none"
                                                         xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M13 6L19 12L13 18" stroke="currentColor"
                                                              strokeWidth="2" strokeLinecap="round"
                                                              strokeLinejoin="round"/>
                                                        <path d="M19 12H5" stroke="currentColor" strokeWidth="2"
                                                              strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                </span>
                                            </Button>

                                            <div
                                                className="flex items-center justify-center mt-3 text-xs text-muted-foreground">
                                                <svg className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" viewBox="0 0 24 24"
                                                     fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                                        strokeLinejoin="round"/>
                                                    <path d="M12 16V12" stroke="currentColor" strokeWidth="2"
                                                          strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2"
                                                          strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                {t('cart', 'termsAgreement')}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    )}
                </div>
            )}

            {/* Mobile cart summary and checkout section */}

            {/* Mobile Delivery Options and Summary */}
            {cartItems.length > 0 && (
                <motion.div
                    initial={{y: 100}}
                    animate={{y: 0}}
                    className="fixed bottom-16 inset-x-0 bg-card pt-3 px-4 pb-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] md:hidden z-20 border-t border-border"
                >
                    {!isAuthenticated && (
                        <div className="flex items-center gap-2 p-3 mb-3 bg-yellow-50 rounded-lg border border-yellow-100 text-sm">
                            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="text-foreground">{t('cart', 'loginRequired')}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-col">
                            <div className="flex items-center">
                                <span className="inline-block w-2 h-2 rounded-full bg-primary mr-1.5"></span>
                                <span className="text-sm text-muted-foreground">{t('cart', 'totalForItems')} {cartItems.length} {getItemNoun(cartItems.length, t)}</span>
                            </div>
                            <div className="font-bold text-lg text-primary">{formatMoney(cartTotal)}</div>
                        </div>
                    </div>

                    <Button
                        className="w-full bg-primary hover:bg-primary/90 py-5 shadow-md transition-all group relative overflow-hidden text-base"
                        onClick={handleCheckout}
                    >
                        <span
                            className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-full bg-black/10 group-hover:translate-x-0"></span>
                        <span className="relative flex items-center justify-center">
                            {!isAuthenticated ? t('cart', 'loginAndCheckout') : t('cart', 'proceedToCheckout')}
                            <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24" fill="none"
                                 xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 6L19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                      strokeLinejoin="round"/>
                                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                      strokeLinejoin="round"/>
                            </svg>
                        </span>
                    </Button>
                </motion.div>
            )}

            <MobileNavigation/>
        </div>
    );
}
