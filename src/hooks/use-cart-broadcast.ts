import {useEffect} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {cartKeys} from "@/lib/queries/cart-queries";

const CHANNEL_NAME = "foodwise-cart";

function isAvailable(): boolean {
    return typeof window !== "undefined" && typeof BroadcastChannel !== "undefined";
}

/**
 * Broadcast that the cart changed to all other tabs.
 * Creates a short-lived sender channel so the recipient listener channel
 * (registered in useCartBroadcast) receives the message.
 */
export function broadcastCartChanged(): void {
    if (!isAvailable()) return;
    const sender = new BroadcastChannel(CHANNEL_NAME);
    sender.postMessage({type: "cart-changed", at: Date.now()});
    // Close after a tick so the message is delivered before cleanup.
    setTimeout(() => sender.close(), 0);
}

export function useCartBroadcast(): void {
    const queryClient = useQueryClient();
    useEffect(() => {
        if (!isAvailable()) return;
        const ch = new BroadcastChannel(CHANNEL_NAME);
        const onMessage = (ev: MessageEvent) => {
            if ((ev.data as {type?: string})?.type === "cart-changed") {
                void queryClient.invalidateQueries({queryKey: cartKeys.all});
            }
        };
        ch.addEventListener("message", onMessage);
        return () => {
            ch.removeEventListener("message", onMessage);
            ch.close();
        };
    }, [queryClient]);
}
