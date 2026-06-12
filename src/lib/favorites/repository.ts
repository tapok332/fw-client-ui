import {FavoriteStoreEntry} from "./types";

export interface FavoritesRepository {
    list(): Promise<FavoriteStoreEntry[]>;
    add(storeId: string): Promise<FavoriteStoreEntry>;
    remove(storeId: string): Promise<void>;
    has(storeId: string): Promise<boolean>;
    bulkCheck(storeIds: string[]): Promise<Record<string, boolean>>;
}

export class FavoritesStorageError extends Error {
    constructor(message: string, public readonly cause?: unknown) {
        super(message);
        this.name = "FavoritesStorageError";
    }
}
