"use client";

import { CreditCard, Banknote, Info } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/locale-context";

export type PaymentMode = "online" | "cash";

export interface PaymentMethodTabsProps {
    value: PaymentMode;
    onValueChange: (value: PaymentMode) => void;
    cashEnabled: boolean;
    cashDisabledReason?: string;
    onlineContent: React.ReactNode;
    cashContent: React.ReactNode;
}

export function PaymentMethodTabs({
    value,
    onValueChange,
    cashEnabled,
    cashDisabledReason,
    onlineContent,
    cashContent,
}: PaymentMethodTabsProps) {
    const { t } = useTranslation();
    return (
        <Tabs
            value={value}
            onValueChange={(v) => onValueChange(v as PaymentMode)}
            className="w-full"
        >
            <TabsList
                className={cn(
                    "grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border border-border bg-muted/40 p-1",
                )}
            >
                <TabsTrigger
                    value="online"
                    className={cn(
                        "flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all",
                        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-[0_2px_8px_-4px_rgba(30,122,58,0.35)]",
                        "data-[state=active]:ring-1 data-[state=active]:ring-primary/40",
                    )}
                >
                    <CreditCard className="h-4 w-4" aria-hidden />
                    <span>{t('checkout', 'onlinePayment')}</span>
                </TabsTrigger>

                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="flex">
                                <TabsTrigger
                                    value="cash"
                                    disabled={!cashEnabled}
                                    className={cn(
                                        "flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all",
                                        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-[0_2px_8px_-4px_rgba(30,122,58,0.35)]",
                                        "data-[state=active]:ring-1 data-[state=active]:ring-primary/40",
                                        !cashEnabled && "cursor-not-allowed opacity-60",
                                    )}
                                >
                                    <Banknote className="h-4 w-4" aria-hidden />
                                    <span>{t('checkout', 'cashPayment')}</span>
                                    {!cashEnabled && (
                                        <Info className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                                    )}
                                </TabsTrigger>
                            </span>
                        </TooltipTrigger>
                        {!cashEnabled && cashDisabledReason && (
                            <TooltipContent side="bottom" className="max-w-[220px] text-center">
                                {cashDisabledReason}
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
            </TabsList>

            <TabsContent value="online" className="mt-4 focus-visible:outline-none">
                {onlineContent}
            </TabsContent>
            <TabsContent value="cash" className="mt-4 focus-visible:outline-none">
                {cashContent}
            </TabsContent>
        </Tabs>
    );
}
