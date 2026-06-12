"use client";

import React, {useEffect} from "react";
import {useAuth} from "@/contexts/auth-context";
import {useLocale} from "@/contexts/locale-context";
import {useRouter} from "next/navigation";
import {Card} from "@/components/ui/card";

export default function OrdersPage() {
  const {isAuthenticated, isLoading} = useAuth();
  const router = useRouter();
  const {t} = useLocale();

  // Protect the orders page on client side
  useEffect(() => {
    let isMounted = true;
    
    if (!isLoading && !isAuthenticated && isMounted) {
      router.push('/login');
    }
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return (
        <div className="container mx-auto py-12 px-4 flex justify-center items-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">{t("orders", "yourOrders")}</h1>

        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">{t("orders", "noOrdersYet")}</p>
          <p>{t("orders", "ordersWillAppearHere")}</p>
        </Card>
      </div>
  );
}
