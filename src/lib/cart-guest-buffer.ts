import type { Money } from "@/types";

const STORAGE_KEY = "foodwise.guest-cart.v1";

export interface GuestCartEntry {
    itemId: string;
    quantity: number;
    name?: string;
    price?: Money;
    imageUrl?: string;
    storeId?: string;
    storeName?: string;
}

function isMoney(v: unknown): v is Money {
    return (
        typeof v === "object" &&
        v !== null &&
        typeof (v as { amount?: unknown }).amount === "string" &&
        typeof (v as { currency?: unknown }).currency === "string"
    );
}

function readRaw(): GuestCartEntry[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter(
                (e): e is Record<string, unknown> =>
                    typeof e === "object" &&
                    e !== null &&
                    typeof (e as {itemId?: unknown}).itemId === "string" &&
                    typeof (e as {quantity?: unknown}).quantity === "number" &&
                    (e as {quantity: number}).quantity > 0,
            )
            .map((e): GuestCartEntry => {
                const entry: GuestCartEntry = {
                    itemId: e.itemId as string,
                    quantity: e.quantity as number,
                };
                if (typeof e.name === "string") entry.name = e.name;
                if (isMoney(e.price)) entry.price = e.price;
                if (typeof e.imageUrl === "string") entry.imageUrl = e.imageUrl;
                if (typeof e.storeId === "string") entry.storeId = e.storeId;
                if (typeof e.storeName === "string") entry.storeName = e.storeName;
                return entry;
            });
    } catch {
        return [];
    }
}

function write(entries: GuestCartEntry[]): void {
    if (typeof window === "undefined") return;
    if (entries.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
    } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
}

// ─── Subscribe / notify machinery ───────────────────────────────────────────
// `snapshot` holds a stable reference that only changes after a write.
// useSyncExternalStore requires getSnapshot to return the same reference
// when the store is unchanged — a new array on every call causes an infinite loop.
type Listener = () => void;
const listeners = new Set<Listener>();
let snapshot: GuestCartEntry[] = readRaw();

function notify(): void {
    snapshot = readRaw(); // refresh cached reference after write
    listeners.forEach((l) => l());
}

function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Stable snapshot for useSyncExternalStore — same reference until next write. */
function getSnapshot(): GuestCartEntry[] {
    return snapshot;
}

// ─── Exported buffer ─────────────────────────────────────────────────────────
export const guestCartBuffer = {
    read: readRaw,

    add: (entry: GuestCartEntry): void => {
        const entries = readRaw();
        const idx = entries.findIndex((e) => e.itemId === entry.itemId);
        if (idx >= 0) {
            // Merge: keep existing display fields unless overwritten by incoming.
            entries[idx] = {
                ...entries[idx],
                ...entry,
                quantity: entries[idx].quantity + entry.quantity,
            };
        } else {
            entries.push(entry);
        }
        write(entries);
        notify();
    },

    setQuantity: (itemId: string, quantity: number): void => {
        const entries = readRaw();
        const existing = entries.find((e) => e.itemId === itemId);
        const next = entries.filter((e) => e.itemId !== itemId);
        if (quantity > 0) {
            next.push(existing ? {...existing, quantity} : {itemId, quantity});
        }
        write(next);
        notify();
    },

    removeItem: (itemId: string): void => {
        write(readRaw().filter((e) => e.itemId !== itemId));
        notify();
    },

    clear: (): void => {
        write([]);
        notify();
    },

    subscribe,
    getSnapshot,
};

// Cross-tab sync: storage event fires only in OTHER tabs.
if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_KEY) notify();
    });
}
