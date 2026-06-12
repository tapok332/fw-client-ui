import {useQuery} from "@tanstack/react-query";
import {api} from "@/lib/api";
import {Order, OrderStatus} from "@/types";

export const orderKeys = {
    all: ["orders"] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
};

const TERMINAL_STATUSES: ReadonlySet<string> = new Set([
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
]);

// The backend mock advances an order one status step per minute. Polling at
// 20s keeps on-screen lag under ~a third of a step without hammering the API.
const POLL_INTERVAL_MS = 20_000;

/**
 * Single-order query that polls while the order is still in flight and stops
 * automatically once it reaches a terminal status (COMPLETED / CANCELLED).
 *
 * Pass {@link initialData} (e.g. an order already in DataContext) for an instant
 * first paint; the query still refetches immediately to drop any stale cache.
 */
export function useOrderQuery(orderId: string, options?: {initialData?: Order}) {
    return useQuery<Order, Error>({
        queryKey: orderKeys.detail(orderId),
        queryFn: async () => {
            const response = await api.orders.getById(orderId);
            if (!response?.data) {
                throw new Error("orderNotFound");
            }
            return response.data;
        },
        enabled: !!orderId,
        initialData: options?.initialData,
        staleTime: 0,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            if (status && TERMINAL_STATUSES.has(status)) {
                return false;
            }
            return POLL_INTERVAL_MS;
        },
        refetchIntervalInBackground: false,
    });
}
