import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {cartApi} from "@/lib/cart-api";
import {ServerCart} from "@/types/cart";
import {ZERO_MONEY, type Money} from "@/types";
import {sumMoney} from "@/lib/utils";
import {broadcastCartChanged} from "@/hooks/use-cart-broadcast";

export const cartKeys = {
    all: ["cart"] as const,
};

export function useCart({isAuthenticated}: {isAuthenticated: boolean}) {
    return useQuery<ServerCart, Error>({
        queryKey: cartKeys.all,
        queryFn: () => cartApi.get(),
        enabled: isAuthenticated,
    });
}

export interface AddToCartInput {
    itemId: string;
    quantity: number;
    name: string;
    price: Money;
    imageUrl: string;
    storeId: string;
}

export function useAddToCartMutation() {
    const queryClient = useQueryClient();

    return useMutation<ServerCart, Error, AddToCartInput, {previous?: ServerCart}>({
        mutationFn: ({itemId, quantity}) => cartApi.addItem({itemId, quantity}),
        onMutate: async (input) => {
            await queryClient.cancelQueries({queryKey: cartKeys.all});
            const previous = queryClient.getQueryData<ServerCart>(cartKeys.all);
            queryClient.setQueryData<ServerCart>(cartKeys.all, (old) => {
                const base: ServerCart = old ?? {cartId: "optimistic", items: [], totalPrice: ZERO_MONEY, itemCount: 0};
                const existingIdx = base.items.findIndex((it) => it.itemId === input.itemId);
                let nextItems = base.items;
                if (existingIdx >= 0) {
                    nextItems = base.items.map((it, i) =>
                        i === existingIdx ? {...it, quantity: it.quantity + input.quantity} : it,
                    );
                } else {
                    nextItems = [
                        ...base.items,
                        {
                            id: `optimistic-${input.itemId}`,
                            itemId: input.itemId,
                            name: input.name,
                            price: input.price,
                            quantity: input.quantity,
                            storeId: input.storeId,
                            imageUrl: input.imageUrl,
                        },
                    ];
                }
                const totalPrice = sumMoney(nextItems, base.totalPrice.currency);
                const itemCount = nextItems.reduce((sum, it) => sum + it.quantity, 0);
                return {...base, items: nextItems, totalPrice, itemCount};
            });
            return {previous};
        },
        onError: (_err, _input, context) => {
            if (context?.previous) queryClient.setQueryData(cartKeys.all, context.previous);
        },
        onSuccess: (server) => {
            queryClient.setQueryData(cartKeys.all, server);
            broadcastCartChanged();
        },
        onSettled: (_data, error) => {
            if (!error) queryClient.invalidateQueries({queryKey: cartKeys.all});
        },
    });
}

export function useUpdateQuantityMutation() {
    const queryClient = useQueryClient();

    return useMutation<ServerCart, Error, {cartItemId: string; quantity: number}, {previous?: ServerCart}>({
        mutationFn: ({cartItemId, quantity}) => cartApi.updateQuantity(cartItemId, quantity),
        onMutate: async ({cartItemId, quantity}) => {
            await queryClient.cancelQueries({queryKey: cartKeys.all});
            const previous = queryClient.getQueryData<ServerCart>(cartKeys.all);
            queryClient.setQueryData<ServerCart>(cartKeys.all, (old) => {
                if (!old) return old;
                // cartItemId is the surprise-box itemId (matches backend contract), not cart-item PK.
                const nextItems = old.items.map((it) => (it.itemId === cartItemId ? {...it, quantity} : it));
                return {
                    ...old,
                    items: nextItems,
                    totalPrice: sumMoney(nextItems, old.totalPrice.currency),
                    itemCount: nextItems.reduce((sum, it) => sum + it.quantity, 0),
                };
            });
            return {previous};
        },
        onError: (_err, _input, context) => {
            if (context?.previous) queryClient.setQueryData(cartKeys.all, context.previous);
        },
        onSuccess: (server) => {
            queryClient.setQueryData(cartKeys.all, server);
            broadcastCartChanged();
        },
        onSettled: (_data, error) => {
            if (!error) queryClient.invalidateQueries({queryKey: cartKeys.all});
        },
    });
}

export function useRemoveItemMutation() {
    const queryClient = useQueryClient();

    return useMutation<ServerCart, Error, {cartItemId: string}, {previous?: ServerCart}>({
        mutationFn: ({cartItemId}) => cartApi.removeItem(cartItemId),
        onMutate: async ({cartItemId}) => {
            await queryClient.cancelQueries({queryKey: cartKeys.all});
            const previous = queryClient.getQueryData<ServerCart>(cartKeys.all);
            queryClient.setQueryData<ServerCart>(cartKeys.all, (old) => {
                if (!old) return old;
                // cartItemId is the surprise-box itemId (matches backend contract).
                const nextItems = old.items.filter((it) => it.itemId !== cartItemId);
                return {
                    ...old,
                    items: nextItems,
                    totalPrice: sumMoney(nextItems, old.totalPrice.currency),
                    itemCount: nextItems.reduce((sum, it) => sum + it.quantity, 0),
                };
            });
            return {previous};
        },
        onError: (_err, _input, context) => {
            if (context?.previous) queryClient.setQueryData(cartKeys.all, context.previous);
        },
        onSuccess: (server) => {
            queryClient.setQueryData(cartKeys.all, server);
            broadcastCartChanged();
        },
        onSettled: (_data, error) => {
            if (!error) queryClient.invalidateQueries({queryKey: cartKeys.all});
        },
    });
}

export function useClearCartMutation() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, void, {previous?: ServerCart}>({
        mutationFn: () => cartApi.clear(),
        onMutate: async () => {
            await queryClient.cancelQueries({queryKey: cartKeys.all});
            const previous = queryClient.getQueryData<ServerCart>(cartKeys.all);
            queryClient.setQueryData<ServerCart>(cartKeys.all, (old) =>
                old ? {...old, items: [], totalPrice: {amount: "0.00", currency: old.totalPrice.currency}, itemCount: 0} : old,
            );
            return {previous};
        },
        onError: (_err, _input, context) => {
            if (context?.previous) queryClient.setQueryData(cartKeys.all, context.previous);
        },
        onSettled: (_data, error) => {
            if (!error) {
                queryClient.invalidateQueries({queryKey: cartKeys.all});
                broadcastCartChanged();
            }
        },
    });
}
