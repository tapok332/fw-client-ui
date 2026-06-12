"use client";

import Link from "next/link";
import {useQuery} from "@tanstack/react-query";
import {Heart} from "lucide-react";
import {motion} from "framer-motion";
import {useLocale} from "@/contexts/locale-context";
import {api} from "@/lib/api";
import {Store} from "@/types";
import {Button} from "@/components/ui/button";
import {StoreCard} from "@/components/store/store-card";
import {FavoriteHeartButton} from "@/components/favorites/favorite-heart-button";
import {useFavoritesBroadcast} from "@/hooks/use-favorites-broadcast";
import {favoritesKeys, useFavoriteStores} from "@/lib/queries/favorites-queries";
import {FavoriteStoreEntry} from "@/lib/favorites";

type FavoriteRow = {
    entry: FavoriteStoreEntry;
    store: Store | null;
};

function useFavoriteRows(entries: FavoriteStoreEntry[] | undefined) {
    const idsKey = entries?.map((e) => e.storeId).join(",") ?? "";
    return useQuery<FavoriteRow[], Error>({
        queryKey: [...favoritesKeys.all, "details", idsKey],
        enabled: !!entries,
        queryFn: async () => {
            if (!entries || entries.length === 0) return [];
            const results = await Promise.allSettled(
                entries.map((entry) => api.stores.getById(entry.storeId)),
            );
            return entries.map((entry, i) => {
                const r = results[i];
                return {
                    entry,
                    store: r.status === "fulfilled" && r.value ? (r.value as Store) : null,
                };
            });
        },
    });
}

export default function FavoritesPage() {
    const {t} = useLocale();
    useFavoritesBroadcast();

    const {data: entries, isLoading: entriesLoading} = useFavoriteStores();
    const {data: rows, isLoading: detailsLoading} = useFavoriteRows(entries);

    const isLoading = entriesLoading || (entries && entries.length > 0 && detailsLoading);
    const isEmpty = !isLoading && (!entries || entries.length === 0);

    return (
        <main className="min-h-screen bg-background pb-20 md:pb-12">
            <header className="px-4 pt-6 pb-4 md:px-8 md:pt-10">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-rose-500 fill-rose-500" aria-hidden />
                    </div>
                    <div>
                        <h1 className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-semibold text-foreground">
                            {t("favorites", "title")}
                        </h1>
                        {entries && entries.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {t("favorites", "count").replace("{count}", String(entries.length))}
                            </p>
                        )}
                    </div>
                </div>
            </header>

            <section className="px-4 md:px-8">
                {isLoading && <FavoritesSkeleton />}
                {isEmpty && <EmptyFavorites />}
                {!isLoading && rows && rows.length > 0 && (
                    <motion.ul
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{duration: 0.3}}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    >
                        {rows.map((row) =>
                            row.store ? (
                                <li key={row.entry.storeId} className="w-full">
                                    <StoreCard store={row.store} />
                                </li>
                            ) : (
                                <li key={row.entry.storeId}>
                                    <UnavailableFavoriteCard storeId={row.entry.storeId} />
                                </li>
                            ),
                        )}
                    </motion.ul>
                )}
            </section>
        </main>
    );
}

function FavoritesSkeleton() {
    return (
        <div
            role="status"
            aria-label="Loading favorites"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
            {Array.from({length: 4}).map((_, i) => (
                <div
                    key={i}
                    className="h-[252px] rounded-3xl bg-muted/40 animate-pulse"
                />
            ))}
        </div>
    );
}

function EmptyFavorites() {
    const {t} = useLocale();
    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.4}}
            className="flex flex-col items-center text-center py-16 px-6 rounded-3xl bg-card border border-border/60"
        >
            <motion.div
                animate={{scale: [1, 1.08, 1]}}
                transition={{repeat: Infinity, duration: 2.4, ease: "easeInOut"}}
                className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-5"
            >
                <Heart className="w-9 h-9 text-rose-400" aria-hidden />
            </motion.div>
            <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-foreground mb-2">
                {t("favorites", "emptyTitle")}
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
                {t("favorites", "emptyDescription")}
            </p>
            <Button asChild size="lg">
                <Link href="/restaurants">{t("favorites", "browseCta")}</Link>
            </Button>
        </motion.div>
    );
}

function UnavailableFavoriteCard({storeId}: {storeId: string}) {
    const {t} = useLocale();
    return (
        <div className="relative h-[252px] rounded-3xl bg-muted/30 border border-dashed border-border flex flex-col items-center justify-center px-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">
                {t("favorites", "storeUnavailable")}
            </p>
            <FavoriteHeartButton storeId={storeId} variant="inline" />
        </div>
    );
}
