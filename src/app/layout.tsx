import React from 'react';
import "./globals.css";
import {Vollkorn, Rubik} from "next/font/google";
import {Toaster} from "@/components/ui/toaster";
import Header from "@/components/Header";
import {AuthProvider} from "@/contexts/auth-context";
import {LocaleProvider} from "@/contexts/locale-context";
import {DataProvider} from "@/contexts/data-context";
import {MobileNavigation} from "@/components/MobileNavigation";
import ErrorSuppressor from "@/components/ErrorSuppressor";
import {UtilsProvider} from "@/lib/utils-context";
import {CartProvider} from "@/contexts/cart-context";
import {ReactQueryProvider} from "@/providers/react-query-provider";

const vollkorn = Vollkorn({subsets: ["latin", "cyrillic"], variable: "--font-heading", display: "swap"});
const rubik = Rubik({subsets: ["latin", "cyrillic"], variable: "--font-body", display: "swap"});

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="uk">
            <body className={`${vollkorn.variable} ${rubik.variable} font-sans`}>
            <UtilsProvider>
                <LocaleProvider>
                    <AuthProvider>
                        <DataProvider>
                            <ReactQueryProvider>
                            <CartProvider>
                                <ErrorSuppressor/>
                                <div className="hidden md:block">
                                    <Header/>
                                </div>
                                {children}
                                <MobileNavigation/>
                                <Toaster/>
                            </CartProvider>
                            </ReactQueryProvider>
                        </DataProvider>
                    </AuthProvider>
                </LocaleProvider>
            </UtilsProvider>
            </body>
        </html>
    );
}
