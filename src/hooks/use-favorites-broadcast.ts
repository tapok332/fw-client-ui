import {useEffect} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {favoritesKeys} from "@/lib/queries/favorites-queries";
import {BROADCAST_CHANNEL, STORAGE_KEY} from "@/lib/favorites";

function isAvailable(): boolean {
    return typeof window !== "undefined" && typeof BroadcastChannel !== "undefined";
}

export function broadcastFavoritesChanged(): void {
    if (!isAvailable()) return;
    const sender = new BroadcastChannel(BROADCAST_CHANNEL);
    sender.postMessage({type: "favorites-changed", at: Date.now()});
    setTimeout(() => sender.close(), 0);
}

export function useFavoritesBroadcast(): void {
    const queryClient = useQueryClient();
    useEffect(() => {
        if (typeof window === "undefined") return;

        const invalidate = () => {
            void queryClient.invalidateQueries({queryKey: favoritesKeys.all});
        };

        let ch: BroadcastChannel | null = null;
        if (typeof BroadcastChannel !== "undefined") {
            ch = new BroadcastChannel(BROADCAST_CHANNEL);
            const onMessage = (ev: MessageEvent) => {
                if ((ev.data as {type?: string})?.type === "favorites-changed") invalidate();
            };
            ch.addEventListener("message", onMessage);
        }

        const onStorage = (ev: StorageEvent) => {
            if (ev.key === STORAGE_KEY) invalidate();
        };
        window.addEventListener("storage", onStorage);

        return () => {
            ch?.close();
            window.removeEventListener("storage", onStorage);
        };
    }, [queryClient]);
}
