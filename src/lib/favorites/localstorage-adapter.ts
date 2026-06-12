import {FavoritesRepository, FavoritesStorageError} from "./repository";
import {FavoriteStoreEntry, FavoritesState, FavoritesStateSchema, STORAGE_KEY} from "./types";

const EMPTY_STATE: FavoritesState = {version: 1, stores: []};

function readState(): FavoritesState {
    if (typeof window === "undefined") return EMPTY_STATE;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    try {
        const parsed = FavoritesStateSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) {
            window.localStorage.removeItem(STORAGE_KEY);
            return EMPTY_STATE;
        }
        return parsed.data;
    } catch {
        window.localStorage.removeItem(STORAGE_KEY);
        return EMPTY_STATE;
    }
}

function writeState(state: FavoritesState): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
        throw new FavoritesStorageError("Failed to persist favorites to localStorage", err);
    }
}

export class LocalStorageFavoritesRepository implements FavoritesRepository {
    async list(): Promise<FavoriteStoreEntry[]> {
        const state = readState();
        return [...state.stores].sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
    }

    async add(storeId: string): Promise<FavoriteStoreEntry> {
        const state = readState();
        const existing = state.stores.find((s) => s.storeId === storeId);
        if (existing) return existing;
        const entry: FavoriteStoreEntry = {storeId, addedAt: new Date().toISOString()};
        writeState({...state, stores: [...state.stores, entry]});
        return entry;
    }

    async remove(storeId: string): Promise<void> {
        const state = readState();
        if (!state.stores.some((s) => s.storeId === storeId)) return;
        writeState({...state, stores: state.stores.filter((s) => s.storeId !== storeId)});
    }

    async has(storeId: string): Promise<boolean> {
        const state = readState();
        return state.stores.some((s) => s.storeId === storeId);
    }

    async bulkCheck(storeIds: string[]): Promise<Record<string, boolean>> {
        const state = readState();
        const set = new Set(state.stores.map((s) => s.storeId));
        return Object.fromEntries(storeIds.map((id) => [id, set.has(id)]));
    }
}
