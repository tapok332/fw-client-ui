"use client";

import {useState} from "react";
import {QueryClientProvider} from "@tanstack/react-query";
import {createQueryClient} from "@/lib/queries/query-client";
import type {ReactNode} from "react";

export function ReactQueryProvider({children}: {children: ReactNode}) {
    const [queryClient] = useState(() => createQueryClient());
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
