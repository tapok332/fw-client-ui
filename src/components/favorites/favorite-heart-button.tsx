"use client";

import {Heart} from "lucide-react";
import {motion, useReducedMotion} from "framer-motion";
import {useLocale} from "@/contexts/locale-context";
import {useToast} from "@/hooks/use-toast";
import {useIsFavorited, useToggleFavoriteMutation} from "@/lib/queries/favorites-queries";
import {cn} from "@/lib/utils";

type Variant = "floating" | "inline";

interface FavoriteHeartButtonProps {
    storeId: string;
    variant?: Variant;
    className?: string;
}

const variantStyles: Record<Variant, string> = {
    floating: "w-10 h-10 bg-white/80 backdrop-blur shadow-md",
    inline: "w-9 h-9 bg-white/95 shadow-sm",
};

export function FavoriteHeartButton({storeId, variant = "floating", className}: FavoriteHeartButtonProps) {
    const {t} = useLocale();
    const {toast} = useToast();
    const isFavorited = useIsFavorited(storeId);
    const toggle = useToggleFavoriteMutation();
    const reduceMotion = useReducedMotion();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (toggle.isPending) return;

        const wasFavorited = isFavorited;
        toggle.mutate(
            {storeId},
            {
                onSuccess: ({favorited}) => {
                    toast({
                        title: favorited ? t("favorites", "addedToast") : t("favorites", "removedToast"),
                        duration: 2000,
                    });
                },
                onError: () => {
                    toast({
                        title: t("favorites", "errorToast"),
                        variant: "destructive",
                    });
                },
            },
        );
        // Trigger pop animation independent of mutation result (optimistic UX).
        void wasFavorited;
    };

    const label = isFavorited
        ? t("favorites", "removeAriaLabel")
        : t("favorites", "addAriaLabel");

    return (
        <motion.button
            type="button"
            onClick={handleClick}
            aria-label={label}
            aria-pressed={isFavorited}
            disabled={toggle.isPending}
            whileTap={reduceMotion ? undefined : {scale: 0.88}}
            transition={{duration: 0.12, ease: [0.23, 1, 0.32, 1]}}
            className={cn(
                "rounded-full flex items-center justify-center transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                "disabled:opacity-70 disabled:cursor-not-allowed",
                variantStyles[variant],
                className,
            )}
        >
            <motion.span
                key={isFavorited ? "filled" : "outline"}
                initial={reduceMotion ? false : {scale: 0.7}}
                animate={reduceMotion ? {scale: 1} : {scale: [0.7, 1.2, 1]}}
                transition={{duration: 0.32, ease: [0.34, 1.56, 0.64, 1], times: [0, 0.6, 1]}}
                className="flex"
            >
                <Heart
                    className={cn(
                        "h-5 w-5 transition-colors duration-200",
                        isFavorited ? "text-rose-500 fill-rose-500" : "text-foreground",
                    )}
                />
            </motion.span>
        </motion.button>
    );
}
