import {ReactElement, ReactNode} from "react";
import {render, RenderOptions} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

export function makeTestQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {retry: false, gcTime: Infinity, staleTime: 0},
            mutations: {retry: false},
        },
    });
}

export function renderWithQuery(
    ui: ReactElement,
    {client, ...options}: {client?: QueryClient} & Omit<RenderOptions, "wrapper"> = {},
) {
    const queryClient = client ?? makeTestQueryClient();
    const Wrapper = ({children}: {children: ReactNode}) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return {queryClient, ...render(ui, {wrapper: Wrapper, ...options})};
}
