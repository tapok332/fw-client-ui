import {LocalStorageFavoritesRepository} from "./localstorage-adapter";
import {FavoritesRepository} from "./repository";

export type {FavoritesRepository} from "./repository";
export {FavoritesStorageError} from "./repository";
export type {FavoriteStoreEntry, FavoritesState} from "./types";
export {STORAGE_KEY, BROADCAST_CHANNEL} from "./types";

let singleton: FavoritesRepository | null = null;

export function getFavoritesRepository(): FavoritesRepository {
    if (!singleton) {
        singleton = new LocalStorageFavoritesRepository();
    }
    return singleton;
}

export function __resetFavoritesRepositoryForTests(): void {
    singleton = null;
}
