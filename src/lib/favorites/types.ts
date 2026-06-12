import {z} from "zod";

export const FavoriteStoreEntrySchema = z.object({
    storeId: z.string().min(1),
    addedAt: z.string().min(1),
});

export type FavoriteStoreEntry = z.infer<typeof FavoriteStoreEntrySchema>;

export const FavoritesStateSchema = z.object({
    version: z.literal(1),
    stores: z.array(FavoriteStoreEntrySchema),
});

export type FavoritesState = z.infer<typeof FavoritesStateSchema>;

export const STORAGE_KEY = "foodwise.favorites.v1";
export const BROADCAST_CHANNEL = "foodwise-favorites";
