import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {getFavoritesRepository, FavoriteStoreEntry} from "@/lib/favorites";
import {broadcastFavoritesChanged} from "@/hooks/use-favorites-broadcast";

export const favoritesKeys = {
    all: ["favorites"] as const,
    stores: () => [...favoritesKeys.all, "stores"] as const,
    has: (storeId: string) => [...favoritesKeys.all, "has", storeId] as const,
};

export function useFavoriteStores() {
    const repo = getFavoritesRepository();
    return useQuery<FavoriteStoreEntry[], Error>({
        queryKey: favoritesKeys.stores(),
        queryFn: () => repo.list(),
        staleTime: 30_000,
    });
}

export function useIsFavorited(storeId: string | undefined) {
    const {data} = useFavoriteStores();
    if (!storeId || !data) return false;
    return data.some((entry) => entry.storeId === storeId);
}

type ToggleContext = {
    previous?: FavoriteStoreEntry[];
    wasFavorited: boolean;
};

export function useToggleFavoriteMutation() {
    const queryClient = useQueryClient();
    const repo = getFavoritesRepository();

    return useMutation<{favorited: boolean}, Error, {storeId: string}, ToggleContext>({
        mutationFn: async ({storeId}) => {
            const isFav = await repo.has(storeId);
            if (isFav) {
                await repo.remove(storeId);
                return {favorited: false};
            }
            await repo.add(storeId);
            return {favorited: true};
        },
        onMutate: async ({storeId}) => {
            await queryClient.cancelQueries({queryKey: favoritesKeys.stores()});
            const previous = queryClient.getQueryData<FavoriteStoreEntry[]>(favoritesKeys.stores());
            const wasFavorited = !!previous?.some((e) => e.storeId === storeId);

            queryClient.setQueryData<FavoriteStoreEntry[]>(favoritesKeys.stores(), (old) => {
                const base = old ?? [];
                if (wasFavorited) {
                    return base.filter((e) => e.storeId !== storeId);
                }
                return [{storeId, addedAt: new Date().toISOString()}, ...base];
            });

            return {previous, wasFavorited};
        },
        onError: (_err, _input, context) => {
            if (context?.previous !== undefined) {
                queryClient.setQueryData(favoritesKeys.stores(), context.previous);
            }
        },
        onSuccess: () => {
            broadcastFavoritesChanged();
        },
        onSettled: (_data, error) => {
            if (!error) {
                void queryClient.invalidateQueries({queryKey: favoritesKeys.all});
            }
        },
    });
}
