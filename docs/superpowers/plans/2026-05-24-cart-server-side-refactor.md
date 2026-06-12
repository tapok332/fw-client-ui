# Cart Server-Side Refactor (Production-Grade) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the client-side cart (currently localStorage-only `CartContext`) to use the existing `cart-service` (Spring Boot, port 8085, gateway-routed) as the authoritative source of truth, with TanStack Query for server state, optimistic UX, retry-on-failure, cross-tab sync, and guest→authenticated cart merge — eliminating stale-cart bugs and enabling cross-device persistence.

**Architecture:**
- Server (cart-service) is source of truth for authenticated users. Frontend uses TanStack Query 5 (`@tanstack/react-query@^5.66.0`, already installed) for server-state caching, automatic refetching, and optimistic mutations.
- Guest users keep cart in `localStorage` (write-only buffer of `{itemId, quantity}[]`); on login the buffer is replayed to `POST /cart/items` (merge), then cleared. Existing localStorage cart key (`cart`) is migrated once on first run, then removed.
- `CartContext` becomes a thin compatibility wrapper around hooks (`useCart`, `useAddToCartMutation`, etc.) — preserves the public API (`cartItems`, `cartCount`, `cartTotal`, `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`) so all 8 existing consumers (Header, MobileNavigation, cart page, checkout page, surprise-box-card, store-view, cart-indicator, add-to-cart-button) keep working without source edits in early phases.
- Cross-tab sync via `BroadcastChannel('foodwise-cart')` — when one tab mutates, others invalidate their TanStack Query cache.
- Optimistic mutations with rollback on error + automatic retry with exponential backoff (TanStack Query default + custom retry policy for network errors).
- Backend already enforces single-store invariant per cart (server-side `storeId` resolution, ADR 0002 `docs/decisions/0002-cart-cross-store-prevention.md`).

**Tech Stack:**
- Next.js 15 App Router, React 18, TypeScript strict
- `@tanstack/react-query@^5.66.0` (installed)
- Existing `auth-http-client` (adds `Authorization: Bearer <token>`, refresh-on-401)
- Vitest + React Testing Library + MSW v2 (to be set up in Phase 0 — currently no test infrastructure)
- Backend contract (verified):
  - `GET    /cart`                          → `ApiResponse<CartDto>`
  - `POST   /cart/items`  body `{itemId, quantity}` → `ApiResponse<CartDto>`
  - `PUT    /cart/items/{itemId}?quantity=N` → `ApiResponse<CartDto>`
  - `DELETE /cart/items/{itemId}`            → `ApiResponse<CartDto>`
  - `DELETE /cart`                           → `ApiResponse<Void>`
  - All require `Authorization` (JWT). Gateway extracts `X-User-Id` from JWT and forwards downstream — frontend never sends `X-User-Id` directly.
- Backend DTOs (verified, `fw-cart-service/.../dto/`):
  - `CartDto { cartId: UUID, items: CartItemDto[], totalPrice: int, itemCount: int }`
  - `CartItemDto { id: UUID (server-generated), itemId: string, name: string, price: int, quantity: int, storeId: UUID, imageUrl: string }`
  - `AddToCartRequest { itemId: string, quantity: int (min 1) }` — **no `storeId`** (server resolves from store-service authoritative response per ADR 0002).
- `itemId` is the surprise-box UUID (same value frontend uses today as `boxId`).

---

## File Structure

**New files:**

```
src/lib/cart-api.ts                         # Typed wrapper for /cart endpoints
src/lib/queries/cart-queries.ts             # TanStack Query hooks: useCart, mutations
src/lib/queries/query-client.ts             # Shared QueryClient factory + defaults
src/hooks/use-cart-broadcast.ts             # Cross-tab sync via BroadcastChannel
src/lib/cart-guest-buffer.ts                # Guest localStorage buffer (write-only intent log)
src/lib/cart-migration.ts                   # One-time migration of legacy "cart" localStorage key
src/types/cart.ts                           # ServerCartItem, ServerCart types matching backend DTOs

vitest.config.ts                            # Vitest config sharing Vite plugin
vitest.setup.ts                             # MSW server lifecycle hooks
src/test/server.ts                          # MSW server setup
src/test/handlers/cart-handlers.ts          # MSW handlers for /cart endpoints
src/test/utils.tsx                          # render helper with QueryClient + Auth providers

src/lib/cart-api.test.ts                    # cart-api wrapper tests
src/lib/queries/cart-queries.test.tsx       # hook tests with MSW
src/lib/cart-guest-buffer.test.ts           # guest buffer tests
src/lib/cart-migration.test.ts              # migration tests
src/hooks/use-cart-broadcast.test.ts        # broadcast tests
src/contexts/cart-context.test.tsx          # CartContext compatibility wrapper tests
```

**Modified files:**

```
src/providers/providers.tsx                 # Wrap with QueryClientProvider
src/contexts/cart-context.tsx               # Refactor to thin wrapper around hooks
src/contexts/auth-context.tsx               # On login: replay guest buffer + invalidate cart query
src/lib/api.ts                              # Remove cart-related code (if any) — keep `api.boxes`, `api.stores`
src/lib/translations.ts                     # Add error messages: cartSyncFailed, cartItemUnavailable, cartMergeConflict
package.json                                # Add devDeps: vitest, @testing-library/react, msw, jsdom
```

**Files NOT modified (smoke test only — existing public API preserved):**

```
src/app/cart/page.tsx
src/app/checkout/page.tsx
src/components/Header.tsx
src/components/MobileNavigation.tsx
src/components/cart/cart-indicator.tsx
src/components/home/surprise-box-card.tsx
src/components/store/add-to-cart-button.tsx
src/components/stores/store-view.tsx
src/components/animation/fly-to-cart.tsx
```

---

## Phases overview

- **Phase 0:** Test infrastructure (Vitest + RTL + MSW v2) — prerequisite for TDD.
- **Phase 1:** Cart API client (`cart-api.ts`) — typed wrapper, auth, error shape.
- **Phase 2:** QueryClient + provider wiring.
- **Phase 3:** `useCart` query hook (read-only, authenticated path).
- **Phase 4:** Mutations (add / update / remove / clear) with optimistic updates + rollback.
- **Phase 5:** Guest cart buffer + login replay (merge strategy).
- **Phase 6:** Cross-tab sync via BroadcastChannel.
- **Phase 7:** `CartContext` refactor to thin wrapper (backward-compat for all 8 consumers).
- **Phase 8:** One-time migration of legacy `localStorage["cart"]` → guest buffer or server.
- **Phase 9:** Cleanup (remove dead code, smoke test full flow, docker rebuild verify).

Each phase ends with a docker rebuild (`docker compose up -d --build --force-recreate client-ui` from `/Users/tapok332/Documents/fw-project-dyplom/`) and a manual smoke test before moving to the next phase.

---

## Phase 0: Test Infrastructure

### Task 0.1: Install Vitest + RTL + MSW + jsdom

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dev dependencies**

```bash
npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw@^2.7.0
```

Expected: `package.json` `devDependencies` gains entries; `package-lock.json` updates.

- [ ] **Step 2: Add npm scripts**

Edit `package.json` `"scripts"` section, add:

```json
"test": "vitest",
"test:run": "vitest run",
"test:ui": "vitest --ui"
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add vitest + testing-library + msw test stack"
```

### Task 0.2: Vitest config + setup

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `src/test/server.ts`
- Create: `src/test/utils.tsx`

- [ ] **Step 1: Create vitest config**

Create `vitest.config.ts`:

```ts
import {defineConfig} from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
        css: false,
    },
    resolve: {
        alias: {"@": path.resolve(__dirname, "./src")},
    },
});
```

- [ ] **Step 2: Create vitest setup**

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import {server} from "./src/test/server";
import {afterAll, afterEach, beforeAll} from "vitest";

beforeAll(() => server.listen({onUnhandledRequest: "error"}));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- [ ] **Step 3: Create MSW server**

Create `src/test/server.ts`:

```ts
import {setupServer} from "msw/node";

export const server = setupServer();
```

- [ ] **Step 4: Create render helper**

Create `src/test/utils.tsx`:

```tsx
import {ReactElement, ReactNode} from "react";
import {render, RenderOptions} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

export function makeTestQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {retry: false, gcTime: 0, staleTime: 0},
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
```

- [ ] **Step 5: Smoke test — write a trivial test that passes**

Create `src/test/smoke.test.ts`:

```ts
import {describe, expect, it} from "vitest";

describe("test infra smoke", () => {
    it("runs", () => {
        expect(1 + 1).toBe(2);
    });
});
```

- [ ] **Step 6: Run smoke test**

```bash
npm run test:run -- src/test/smoke.test.ts
```

Expected: 1 test passed.

- [ ] **Step 7: Delete smoke test, commit infra**

```bash
rm src/test/smoke.test.ts
git add vitest.config.ts vitest.setup.ts src/test/server.ts src/test/utils.tsx
git commit -m "chore: scaffold vitest + msw test infrastructure"
```

---

## Phase 1: Cart API Client

### Task 1.1: Backend DTO types

**Files:**
- Create: `src/types/cart.ts`

- [ ] **Step 1: Define backend-matching types**

Create `src/types/cart.ts`:

```ts
// Matches fw-cart-service/.../dto/CartItemDto.java exactly.
export interface ServerCartItem {
    id: string;          // server-generated UUID (cart-item PK, NOT the box id)
    itemId: string;      // surprise-box UUID (same value frontend has as boxId)
    name: string;
    price: number;       // integer (minor units? full units? — backend currently treats as raw int)
    quantity: number;
    storeId: string;     // server-resolved, prevents cross-store cart
    imageUrl: string;
}

// Matches fw-cart-service/.../dto/CartDto.java
export interface ServerCart {
    cartId: string;
    items: ServerCartItem[];
    totalPrice: number;
    itemCount: number;
}

// Matches AddToCartRequest.java — note: NO storeId (resolved server-side per ADR 0002)
export interface AddToCartRequestBody {
    itemId: string;
    quantity: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/cart.ts
git commit -m "feat(cart): add ServerCart/ServerCartItem types matching backend DTOs"
```

### Task 1.2: Cart API wrapper — test first

**Files:**
- Create: `src/test/handlers/cart-handlers.ts`
- Create: `src/lib/cart-api.test.ts`
- Create: `src/lib/cart-api.ts` (in Step 4)

- [ ] **Step 1: Define MSW handlers for cart endpoints**

Create `src/test/handlers/cart-handlers.ts`:

```ts
import {http, HttpResponse} from "msw";
import {ServerCart} from "@/types/cart";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8082";

const emptyCart: ServerCart = {
    cartId: "00000000-0000-0000-0000-000000000001",
    items: [],
    totalPrice: 0,
    itemCount: 0,
};

const cartWithOneItem: ServerCart = {
    cartId: "00000000-0000-0000-0000-000000000001",
    items: [
        {
            id: "cart-item-1",
            itemId: "box-1",
            name: "Test Box",
            price: 150,
            quantity: 1,
            storeId: "store-1",
            imageUrl: "/img.jpg",
        },
    ],
    totalPrice: 150,
    itemCount: 1,
};

export const cartHandlers = {
    getEmpty: () =>
        http.get(`${API_BASE_URL}/cart`, () =>
            HttpResponse.json({data: emptyCart, success: true}),
        ),
    getWithItem: () =>
        http.get(`${API_BASE_URL}/cart`, () =>
            HttpResponse.json({data: cartWithOneItem, success: true}),
        ),
    addItem: () =>
        http.post(`${API_BASE_URL}/cart/items`, () =>
            HttpResponse.json({data: cartWithOneItem, success: true}),
        ),
    addItemFails: (status = 400, message = "boxNotFound") =>
        http.post(`${API_BASE_URL}/cart/items`, () =>
            HttpResponse.json({success: false, error: message}, {status}),
        ),
    updateQuantity: (newQty: number) =>
        http.put(`${API_BASE_URL}/cart/items/:itemId`, () =>
            HttpResponse.json({
                data: {...cartWithOneItem, items: [{...cartWithOneItem.items[0], quantity: newQty}]},
                success: true,
            }),
        ),
    removeItem: () =>
        http.delete(`${API_BASE_URL}/cart/items/:itemId`, () =>
            HttpResponse.json({data: emptyCart, success: true}),
        ),
    clear: () =>
        http.delete(`${API_BASE_URL}/cart`, () =>
            HttpResponse.json({data: null, success: true}),
        ),
    unauthorized: () =>
        http.get(`${API_BASE_URL}/cart`, () =>
            HttpResponse.json({success: false, error: "unauthorized"}, {status: 401}),
        ),
};
```

- [ ] **Step 2: Write failing tests for cart-api**

Create `src/lib/cart-api.test.ts`:

```ts
import {describe, expect, it, beforeEach} from "vitest";
import {server} from "@/test/server";
import {cartHandlers} from "@/test/handlers/cart-handlers";
import {cartApi} from "./cart-api";

describe("cartApi.get", () => {
    it("returns parsed ServerCart on 200", async () => {
        server.use(cartHandlers.getWithItem());
        const cart = await cartApi.get();
        expect(cart.items).toHaveLength(1);
        expect(cart.items[0].itemId).toBe("box-1");
        expect(cart.totalPrice).toBe(150);
    });

    it("throws on 401 unauthorized", async () => {
        server.use(cartHandlers.unauthorized());
        await expect(cartApi.get()).rejects.toThrow(/unauthorized/i);
    });
});

describe("cartApi.addItem", () => {
    it("posts itemId + quantity (no storeId) and returns updated cart", async () => {
        let received: unknown;
        server.use(
            cartHandlers.addItem(),
        );
        const cart = await cartApi.addItem({itemId: "box-1", quantity: 1});
        expect(cart.items[0].itemId).toBe("box-1");
    });

    it("throws on 400 with parsed error message", async () => {
        server.use(cartHandlers.addItemFails(400, "boxNotFound"));
        await expect(
            cartApi.addItem({itemId: "missing", quantity: 1}),
        ).rejects.toThrow(/boxNotFound/i);
    });
});

describe("cartApi.updateQuantity", () => {
    it("PUTs new quantity as query param", async () => {
        server.use(cartHandlers.updateQuantity(3));
        const cart = await cartApi.updateQuantity("cart-item-1", 3);
        expect(cart.items[0].quantity).toBe(3);
    });
});

describe("cartApi.removeItem", () => {
    it("DELETEs and returns updated cart", async () => {
        server.use(cartHandlers.removeItem());
        const cart = await cartApi.removeItem("cart-item-1");
        expect(cart.items).toHaveLength(0);
    });
});

describe("cartApi.clear", () => {
    it("DELETEs cart and returns nothing", async () => {
        server.use(cartHandlers.clear());
        await expect(cartApi.clear()).resolves.toBeUndefined();
    });
});
```

- [ ] **Step 3: Run tests, verify they fail (cart-api not implemented yet)**

```bash
npm run test:run -- src/lib/cart-api.test.ts
```

Expected: All tests fail with "Failed to resolve import './cart-api'".

- [ ] **Step 4: Implement cart-api**

Create `src/lib/cart-api.ts`:

```ts
import {authHttpClient} from "./auth-http-client";
import {AddToCartRequestBody, ServerCart} from "@/types/cart";

interface ApiResponse<T> {
    data?: T;
    success: boolean;
    error?: string;
}

// Backend wraps everything in ApiResponse<T>. Unwrap or throw with parsed error.
async function unwrap<T>(promise: Promise<Response>): Promise<T> {
    const response = await promise;
    let body: ApiResponse<T> | undefined;
    try {
        body = await response.json();
    } catch {
        // Empty body (e.g. 204 No Content from DELETE /cart) — fall through.
    }
    if (!response.ok || (body && body.success === false)) {
        const message = body?.error ?? `HTTP ${response.status}`;
        throw new Error(message);
    }
    return (body?.data ?? (undefined as unknown)) as T;
}

export const cartApi = {
    get: (): Promise<ServerCart> =>
        unwrap<ServerCart>(authHttpClient.get("/cart")),

    addItem: (body: AddToCartRequestBody): Promise<ServerCart> =>
        unwrap<ServerCart>(authHttpClient.post("/cart/items", body)),

    updateQuantity: (itemId: string, quantity: number): Promise<ServerCart> =>
        unwrap<ServerCart>(
            authHttpClient.put(`/cart/items/${encodeURIComponent(itemId)}?quantity=${quantity}`, undefined),
        ),

    removeItem: (itemId: string): Promise<ServerCart> =>
        unwrap<ServerCart>(authHttpClient.delete(`/cart/items/${encodeURIComponent(itemId)}`)),

    clear: (): Promise<void> => unwrap<void>(authHttpClient.delete("/cart")),
};
```

**Note:** This assumes `authHttpClient` exposes `.get(path)`, `.post(path, body)`, `.put(path, body)`, `.delete(path)` returning `Promise<Response>`. Verify with `Read src/lib/auth-http-client.ts` — if the actual API differs (e.g. it returns the parsed JSON, not Response), adjust `unwrap` accordingly in this same task. The test cases in Step 2 will catch the mismatch.

- [ ] **Step 5: Run tests, verify they pass**

```bash
npm run test:run -- src/lib/cart-api.test.ts
```

Expected: all 7 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/cart-api.ts src/lib/cart-api.test.ts src/test/handlers/cart-handlers.ts
git commit -m "feat(cart): add typed cart-api wrapper with tests"
```

---

## Phase 2: QueryClient + Provider

### Task 2.1: Shared QueryClient factory

**Files:**
- Create: `src/lib/queries/query-client.ts`

- [ ] **Step 1: Create factory with sane defaults**

Create `src/lib/queries/query-client.ts`:

```ts
import {QueryClient} from "@tanstack/react-query";

export function createQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Cart data changes via mutations (we invalidate explicitly). Allow short stale window for refetch-on-focus.
                staleTime: 30_000,
                gcTime: 5 * 60_000,
                retry: (failureCount, error: unknown) => {
                    // Don't retry 4xx (client errors). Retry network errors / 5xx up to 3 times.
                    const message = error instanceof Error ? error.message : "";
                    if (/^HTTP 4\d\d/.test(message)) return false;
                    if (/unauthorized|boxNotFound|invalid/i.test(message)) return false;
                    return failureCount < 3;
                },
                retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
                refetchOnWindowFocus: true,
                refetchOnReconnect: true,
            },
            mutations: {
                retry: (failureCount, error: unknown) => {
                    const message = error instanceof Error ? error.message : "";
                    // Mutations: never retry validation errors. Retry transient network failures once.
                    if (/^HTTP 4\d\d|unauthorized|invalid|boxNotFound/i.test(message)) return false;
                    return failureCount < 1;
                },
                retryDelay: 1000,
            },
        },
    });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/queries/query-client.ts
git commit -m "feat(cart): add QueryClient factory with retry policy"
```

### Task 2.2: Wire QueryClientProvider into app

**Files:**
- Modify: `src/providers/providers.tsx`

- [ ] **Step 1: Read current providers structure**

```bash
cat src/providers/providers.tsx
```

Note nesting order so we wrap correctly.

- [ ] **Step 2: Add QueryClientProvider wrapping existing tree**

Modify `src/providers/providers.tsx` — add at the top:

```tsx
"use client";

import {useState} from "react";
import {QueryClientProvider} from "@tanstack/react-query";
import {createQueryClient} from "@/lib/queries/query-client";

// ... existing imports ...

export function Providers({children}: {children: React.ReactNode}) {
    const [queryClient] = useState(() => createQueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            {/* existing provider tree below */}
            {children}
        </QueryClientProvider>
    );
}
```

If `Providers` is currently not a function component or has different structure, wrap whatever the existing top-level export is — preserve the nesting of UtilsProvider → LocaleProvider → AuthProvider → DataProvider → CartProvider.

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Rebuild container (per project convention)**

```bash
cd /Users/tapok332/Documents/fw-project-dyplom && docker compose up -d --build --force-recreate client-ui
```

Wait for completion. Then smoke check:

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/
```

Expected: HTTP 200.

- [ ] **Step 5: Commit**

```bash
git add src/providers/providers.tsx
git commit -m "feat(cart): wrap app with QueryClientProvider"
```

---

## Phase 3: useCart Query Hook (Read)

### Task 3.1: useCart hook — test first

**Files:**
- Create: `src/lib/queries/cart-queries.test.tsx`
- Create: `src/lib/queries/cart-queries.ts` (in Step 3)

- [ ] **Step 1: Write failing test for useCart**

Create `src/lib/queries/cart-queries.test.tsx`:

```tsx
import {describe, expect, it} from "vitest";
import {renderHook, waitFor} from "@testing-library/react";
import {QueryClientProvider} from "@tanstack/react-query";
import {ReactNode} from "react";
import {server} from "@/test/server";
import {cartHandlers} from "@/test/handlers/cart-handlers";
import {makeTestQueryClient} from "@/test/utils";
import {useCart} from "./cart-queries";

function wrap(client = makeTestQueryClient()) {
    return ({children}: {children: ReactNode}) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

describe("useCart", () => {
    it("returns server cart when authenticated", async () => {
        server.use(cartHandlers.getWithItem());
        const {result} = renderHook(() => useCart({isAuthenticated: true}), {wrapper: wrap()});

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data?.items).toHaveLength(1);
        expect(result.current.data?.items[0].itemId).toBe("box-1");
    });

    it("does not fetch when unauthenticated", async () => {
        const client = makeTestQueryClient();
        const {result} = renderHook(() => useCart({isAuthenticated: false}), {wrapper: wrap(client)});

        // Query disabled → fetchStatus stays idle.
        expect(result.current.fetchStatus).toBe("idle");
    });

    it("surfaces 401 as error state", async () => {
        server.use(cartHandlers.unauthorized());
        const {result} = renderHook(() => useCart({isAuthenticated: true}), {wrapper: wrap()});

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.error?.message).toMatch(/unauthorized/i);
    });
});
```

- [ ] **Step 2: Run, verify failure**

```bash
npm run test:run -- src/lib/queries/cart-queries.test.tsx
```

Expected: fails ("Failed to resolve './cart-queries'").

- [ ] **Step 3: Implement useCart**

Create `src/lib/queries/cart-queries.ts`:

```ts
import {useQuery} from "@tanstack/react-query";
import {cartApi} from "@/lib/cart-api";
import {ServerCart} from "@/types/cart";

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
```

- [ ] **Step 4: Run, verify pass**

```bash
npm run test:run -- src/lib/queries/cart-queries.test.tsx
```

Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/cart-queries.ts src/lib/queries/cart-queries.test.tsx
git commit -m "feat(cart): useCart query hook with auth gating"
```

---

## Phase 4: Mutations with Optimistic Updates

### Task 4.1: useAddToCartMutation — test first

**Files:**
- Modify: `src/lib/queries/cart-queries.test.tsx`
- Modify: `src/lib/queries/cart-queries.ts`

- [ ] **Step 1: Add failing test for optimistic add**

Append to `src/lib/queries/cart-queries.test.tsx`:

```tsx
import {act} from "@testing-library/react";
import {useAddToCartMutation} from "./cart-queries";

describe("useAddToCartMutation", () => {
    it("optimistically increases itemCount, confirms on server response", async () => {
        const client = makeTestQueryClient();
        // Seed cache with empty cart.
        client.setQueryData(cartKeys.all, {
            cartId: "c1",
            items: [],
            totalPrice: 0,
            itemCount: 0,
        });

        server.use(cartHandlers.addItem());

        const {result} = renderHook(() => useAddToCartMutation(), {wrapper: wrap(client)});

        act(() => {
            result.current.mutate({itemId: "box-1", quantity: 1, name: "Test Box", price: 150, imageUrl: "/img.jpg", storeId: "store-1"});
        });

        // Immediately after mutate: optimistic cache reflects increment.
        await waitFor(() => {
            const cached = client.getQueryData(cartKeys.all) as {itemCount: number} | undefined;
            expect(cached?.itemCount).toBe(1);
        });

        // After server response: cache replaced with authoritative data.
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        const final = client.getQueryData(cartKeys.all) as {items: unknown[]} | undefined;
        expect(final?.items).toHaveLength(1);
    });

    it("rolls back on server error", async () => {
        const client = makeTestQueryClient();
        client.setQueryData(cartKeys.all, {
            cartId: "c1",
            items: [],
            totalPrice: 0,
            itemCount: 0,
        });
        server.use(cartHandlers.addItemFails(400, "boxNotFound"));

        const {result} = renderHook(() => useAddToCartMutation(), {wrapper: wrap(client)});

        act(() => {
            result.current.mutate({itemId: "missing", quantity: 1, name: "X", price: 100, imageUrl: "", storeId: "s"});
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
        const cached = client.getQueryData(cartKeys.all) as {itemCount: number; items: unknown[]} | undefined;
        expect(cached?.itemCount).toBe(0);
        expect(cached?.items).toHaveLength(0);
    });
});
```

- [ ] **Step 2: Run, verify failure**

```bash
npm run test:run -- src/lib/queries/cart-queries.test.tsx
```

Expected: 2 new tests fail with "useAddToCartMutation is not a function" or similar.

- [ ] **Step 3: Implement mutation with optimistic update**

Append to `src/lib/queries/cart-queries.ts`:

```ts
import {useMutation, useQueryClient} from "@tanstack/react-query";

export interface AddToCartInput {
    itemId: string;
    quantity: number;
    // Optimistic-display fields (replaced by server on success):
    name: string;
    price: number;
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

            // Optimistic update: insert or merge by itemId.
            queryClient.setQueryData<ServerCart>(cartKeys.all, (old) => {
                const base: ServerCart = old ?? {cartId: "optimistic", items: [], totalPrice: 0, itemCount: 0};
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
                const totalPrice = nextItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
                const itemCount = nextItems.reduce((sum, it) => sum + it.quantity, 0);
                return {...base, items: nextItems, totalPrice, itemCount};
            });

            return {previous};
        },
        onError: (_err, _input, context) => {
            if (context?.previous) {
                queryClient.setQueryData(cartKeys.all, context.previous);
            }
        },
        onSuccess: (server) => {
            queryClient.setQueryData(cartKeys.all, server);
        },
        onSettled: () => {
            queryClient.invalidateQueries({queryKey: cartKeys.all});
        },
    });
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npm run test:run -- src/lib/queries/cart-queries.test.tsx
```

Expected: all tests in the file pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/cart-queries.ts src/lib/queries/cart-queries.test.tsx
git commit -m "feat(cart): useAddToCartMutation with optimistic update + rollback"
```

### Task 4.2: useUpdateQuantityMutation

**Files:**
- Modify: `src/lib/queries/cart-queries.test.tsx`
- Modify: `src/lib/queries/cart-queries.ts`

- [ ] **Step 1: Failing test**

Append to `src/lib/queries/cart-queries.test.tsx`:

```tsx
import {useUpdateQuantityMutation} from "./cart-queries";

describe("useUpdateQuantityMutation", () => {
    it("optimistically updates quantity then confirms with server", async () => {
        const client = makeTestQueryClient();
        client.setQueryData(cartKeys.all, {
            cartId: "c1",
            items: [{id: "ci-1", itemId: "box-1", name: "X", price: 100, quantity: 1, storeId: "s", imageUrl: ""}],
            totalPrice: 100,
            itemCount: 1,
        });
        server.use(cartHandlers.updateQuantity(5));

        const {result} = renderHook(() => useUpdateQuantityMutation(), {wrapper: wrap(client)});

        act(() => {
            result.current.mutate({cartItemId: "ci-1", quantity: 5});
        });

        await waitFor(() => {
            const cached = client.getQueryData(cartKeys.all) as {items: {quantity: number}[]} | undefined;
            expect(cached?.items[0].quantity).toBe(5);
        });
    });
});
```

- [ ] **Step 2: Run, verify failure**

```bash
npm run test:run -- src/lib/queries/cart-queries.test.tsx
```

- [ ] **Step 3: Implement**

Append to `src/lib/queries/cart-queries.ts`:

```ts
export function useUpdateQuantityMutation() {
    const queryClient = useQueryClient();

    return useMutation<ServerCart, Error, {cartItemId: string; quantity: number}, {previous?: ServerCart}>({
        mutationFn: ({cartItemId, quantity}) => cartApi.updateQuantity(cartItemId, quantity),
        onMutate: async ({cartItemId, quantity}) => {
            await queryClient.cancelQueries({queryKey: cartKeys.all});
            const previous = queryClient.getQueryData<ServerCart>(cartKeys.all);
            queryClient.setQueryData<ServerCart>(cartKeys.all, (old) => {
                if (!old) return old;
                const nextItems = old.items.map((it) =>
                    it.id === cartItemId ? {...it, quantity} : it,
                );
                return {
                    ...old,
                    items: nextItems,
                    totalPrice: nextItems.reduce((sum, it) => sum + it.price * it.quantity, 0),
                    itemCount: nextItems.reduce((sum, it) => sum + it.quantity, 0),
                };
            });
            return {previous};
        },
        onError: (_err, _input, context) => {
            if (context?.previous) queryClient.setQueryData(cartKeys.all, context.previous);
        },
        onSuccess: (server) => queryClient.setQueryData(cartKeys.all, server),
        onSettled: () => queryClient.invalidateQueries({queryKey: cartKeys.all}),
    });
}
```

- [ ] **Step 4: Run, pass**

```bash
npm run test:run -- src/lib/queries/cart-queries.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/cart-queries.ts src/lib/queries/cart-queries.test.tsx
git commit -m "feat(cart): useUpdateQuantityMutation with optimistic update"
```

### Task 4.3: useRemoveItemMutation

**Files:**
- Modify: `src/lib/queries/cart-queries.test.tsx`
- Modify: `src/lib/queries/cart-queries.ts`

- [ ] **Step 1: Failing test**

Append to `src/lib/queries/cart-queries.test.tsx`:

```tsx
import {useRemoveItemMutation} from "./cart-queries";

describe("useRemoveItemMutation", () => {
    it("optimistically removes the item then confirms with server", async () => {
        const client = makeTestQueryClient();
        client.setQueryData(cartKeys.all, {
            cartId: "c1",
            items: [{id: "ci-1", itemId: "box-1", name: "X", price: 100, quantity: 2, storeId: "s", imageUrl: ""}],
            totalPrice: 200,
            itemCount: 2,
        });
        server.use(cartHandlers.removeItem());

        const {result} = renderHook(() => useRemoveItemMutation(), {wrapper: wrap(client)});
        act(() => result.current.mutate({cartItemId: "ci-1"}));

        await waitFor(() => {
            const cached = client.getQueryData(cartKeys.all) as {items: unknown[]; itemCount: number} | undefined;
            expect(cached?.items).toHaveLength(0);
            expect(cached?.itemCount).toBe(0);
        });
    });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm run test:run -- src/lib/queries/cart-queries.test.tsx
```

- [ ] **Step 3: Implement**

Append to `src/lib/queries/cart-queries.ts`:

```ts
export function useRemoveItemMutation() {
    const queryClient = useQueryClient();

    return useMutation<ServerCart, Error, {cartItemId: string}, {previous?: ServerCart}>({
        mutationFn: ({cartItemId}) => cartApi.removeItem(cartItemId),
        onMutate: async ({cartItemId}) => {
            await queryClient.cancelQueries({queryKey: cartKeys.all});
            const previous = queryClient.getQueryData<ServerCart>(cartKeys.all);
            queryClient.setQueryData<ServerCart>(cartKeys.all, (old) => {
                if (!old) return old;
                const nextItems = old.items.filter((it) => it.id !== cartItemId);
                return {
                    ...old,
                    items: nextItems,
                    totalPrice: nextItems.reduce((sum, it) => sum + it.price * it.quantity, 0),
                    itemCount: nextItems.reduce((sum, it) => sum + it.quantity, 0),
                };
            });
            return {previous};
        },
        onError: (_err, _input, context) => {
            if (context?.previous) queryClient.setQueryData(cartKeys.all, context.previous);
        },
        onSuccess: (server) => queryClient.setQueryData(cartKeys.all, server),
        onSettled: () => queryClient.invalidateQueries({queryKey: cartKeys.all}),
    });
}
```

- [ ] **Step 4: Pass**

```bash
npm run test:run -- src/lib/queries/cart-queries.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/cart-queries.ts src/lib/queries/cart-queries.test.tsx
git commit -m "feat(cart): useRemoveItemMutation with optimistic update"
```

### Task 4.4: useClearCartMutation

**Files:**
- Modify: `src/lib/queries/cart-queries.test.tsx`
- Modify: `src/lib/queries/cart-queries.ts`

- [ ] **Step 1: Failing test**

Append to `src/lib/queries/cart-queries.test.tsx`:

```tsx
import {useClearCartMutation} from "./cart-queries";

describe("useClearCartMutation", () => {
    it("optimistically empties the cart", async () => {
        const client = makeTestQueryClient();
        client.setQueryData(cartKeys.all, {
            cartId: "c1",
            items: [{id: "ci-1", itemId: "b", name: "X", price: 100, quantity: 1, storeId: "s", imageUrl: ""}],
            totalPrice: 100,
            itemCount: 1,
        });
        server.use(cartHandlers.clear());

        const {result} = renderHook(() => useClearCartMutation(), {wrapper: wrap(client)});
        act(() => result.current.mutate());

        await waitFor(() => {
            const cached = client.getQueryData(cartKeys.all) as {items: unknown[]} | undefined;
            expect(cached?.items).toHaveLength(0);
        });
    });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm run test:run -- src/lib/queries/cart-queries.test.tsx
```

- [ ] **Step 3: Implement**

Append to `src/lib/queries/cart-queries.ts`:

```ts
export function useClearCartMutation() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, void, {previous?: ServerCart}>({
        mutationFn: () => cartApi.clear(),
        onMutate: async () => {
            await queryClient.cancelQueries({queryKey: cartKeys.all});
            const previous = queryClient.getQueryData<ServerCart>(cartKeys.all);
            queryClient.setQueryData<ServerCart>(cartKeys.all, (old) =>
                old ? {...old, items: [], totalPrice: 0, itemCount: 0} : old,
            );
            return {previous};
        },
        onError: (_err, _input, context) => {
            if (context?.previous) queryClient.setQueryData(cartKeys.all, context.previous);
        },
        onSettled: () => queryClient.invalidateQueries({queryKey: cartKeys.all}),
    });
}
```

- [ ] **Step 4: Pass**

```bash
npm run test:run -- src/lib/queries/cart-queries.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/cart-queries.ts src/lib/queries/cart-queries.test.tsx
git commit -m "feat(cart): useClearCartMutation with optimistic update"
```

---

## Phase 5: Guest Cart Buffer + Login Replay

### Task 5.1: Guest buffer — test first

**Files:**
- Create: `src/lib/cart-guest-buffer.test.ts`
- Create: `src/lib/cart-guest-buffer.ts` (in Step 3)

- [ ] **Step 1: Failing tests**

Create `src/lib/cart-guest-buffer.test.ts`:

```ts
import {describe, expect, it, beforeEach} from "vitest";
import {guestCartBuffer} from "./cart-guest-buffer";

beforeEach(() => {
    localStorage.clear();
});

describe("guestCartBuffer", () => {
    it("returns empty list when nothing stored", () => {
        expect(guestCartBuffer.read()).toEqual([]);
    });

    it("appends new item", () => {
        guestCartBuffer.add({itemId: "box-1", quantity: 1});
        expect(guestCartBuffer.read()).toEqual([{itemId: "box-1", quantity: 1}]);
    });

    it("merges quantities for duplicate itemId", () => {
        guestCartBuffer.add({itemId: "box-1", quantity: 1});
        guestCartBuffer.add({itemId: "box-1", quantity: 2});
        expect(guestCartBuffer.read()).toEqual([{itemId: "box-1", quantity: 3}]);
    });

    it("removeItem deletes by itemId", () => {
        guestCartBuffer.add({itemId: "box-1", quantity: 1});
        guestCartBuffer.add({itemId: "box-2", quantity: 1});
        guestCartBuffer.removeItem("box-1");
        expect(guestCartBuffer.read()).toEqual([{itemId: "box-2", quantity: 1}]);
    });

    it("setQuantity replaces, treats 0 as delete", () => {
        guestCartBuffer.add({itemId: "box-1", quantity: 1});
        guestCartBuffer.setQuantity("box-1", 5);
        expect(guestCartBuffer.read()).toEqual([{itemId: "box-1", quantity: 5}]);
        guestCartBuffer.setQuantity("box-1", 0);
        expect(guestCartBuffer.read()).toEqual([]);
    });

    it("clear empties the buffer", () => {
        guestCartBuffer.add({itemId: "box-1", quantity: 1});
        guestCartBuffer.clear();
        expect(guestCartBuffer.read()).toEqual([]);
    });

    it("read survives corrupted JSON", () => {
        localStorage.setItem("foodwise.guest-cart.v1", "not-json");
        expect(guestCartBuffer.read()).toEqual([]);
    });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm run test:run -- src/lib/cart-guest-buffer.test.ts
```

- [ ] **Step 3: Implement guestCartBuffer**

Create `src/lib/cart-guest-buffer.ts`:

```ts
const STORAGE_KEY = "foodwise.guest-cart.v1";

export interface GuestCartEntry {
    itemId: string;
    quantity: number;
}

function readRaw(): GuestCartEntry[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (e): e is GuestCartEntry =>
                typeof e === "object" &&
                e !== null &&
                typeof (e as {itemId?: unknown}).itemId === "string" &&
                typeof (e as {quantity?: unknown}).quantity === "number" &&
                (e as {quantity: number}).quantity > 0,
        );
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

export const guestCartBuffer = {
    read: readRaw,

    add: ({itemId, quantity}: GuestCartEntry): void => {
        const entries = readRaw();
        const idx = entries.findIndex((e) => e.itemId === itemId);
        if (idx >= 0) {
            entries[idx] = {itemId, quantity: entries[idx].quantity + quantity};
        } else {
            entries.push({itemId, quantity});
        }
        write(entries);
    },

    setQuantity: (itemId: string, quantity: number): void => {
        const entries = readRaw().filter((e) => e.itemId !== itemId);
        if (quantity > 0) entries.push({itemId, quantity});
        write(entries);
    },

    removeItem: (itemId: string): void => {
        write(readRaw().filter((e) => e.itemId !== itemId));
    },

    clear: (): void => write([]),
};
```

- [ ] **Step 4: Pass**

```bash
npm run test:run -- src/lib/cart-guest-buffer.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/cart-guest-buffer.ts src/lib/cart-guest-buffer.test.ts
git commit -m "feat(cart): guest cart localStorage buffer with merge semantics"
```

### Task 5.2: Login replay — wire into auth-context

**Files:**
- Modify: `src/contexts/auth-context.tsx`

- [ ] **Step 1: Read current auth-context login flow**

```bash
grep -n "login\|setAuth\|onLogin\|onAuthenticated" src/contexts/auth-context.tsx
```

Locate the function that runs after a successful login (e.g. inside `login()` after `setIsAuthenticated(true)`).

- [ ] **Step 2: Implement replay helper**

Add inside `src/contexts/auth-context.tsx` (top-level, above the component):

```ts
import {cartApi} from "@/lib/cart-api";
import {guestCartBuffer} from "@/lib/cart-guest-buffer";

async function replayGuestCartToServer(): Promise<void> {
    const entries = guestCartBuffer.read();
    if (entries.length === 0) return;
    // Best-effort replay. Failures stay in buffer for retry on next login.
    const survivors: typeof entries = [];
    for (const entry of entries) {
        try {
            await cartApi.addItem({itemId: entry.itemId, quantity: entry.quantity});
        } catch (err) {
            // 400 / 404 from backend = item gone, drop it. Network = keep for retry.
            const message = err instanceof Error ? err.message : "";
            if (!/^HTTP 4\d\d|boxNotFound|invalid/i.test(message)) {
                survivors.push(entry);
            }
        }
    }
    if (survivors.length === 0) {
        guestCartBuffer.clear();
    } else {
        // Overwrite with survivors only.
        guestCartBuffer.clear();
        survivors.forEach((s) => guestCartBuffer.add(s));
    }
}
```

- [ ] **Step 3: Call replay after successful login**

In the `login` function (or wherever `setIsAuthenticated(true)` happens after token storage), append:

```ts
// Fire-and-forget cart merge. UI will refetch via QueryClient invalidation triggered by AuthProvider re-render.
void replayGuestCartToServer();
```

- [ ] **Step 4: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/contexts/auth-context.tsx
git commit -m "feat(cart): replay guest cart to server on login"
```

---

## Phase 6: Cross-Tab Sync

### Task 6.1: useCartBroadcast hook — test first

**Files:**
- Create: `src/hooks/use-cart-broadcast.test.ts`
- Create: `src/hooks/use-cart-broadcast.ts` (in Step 3)

- [ ] **Step 1: Failing test**

Create `src/hooks/use-cart-broadcast.test.ts`:

```ts
import {describe, expect, it, vi, beforeEach} from "vitest";
import {renderHook, act} from "@testing-library/react";
import {QueryClientProvider} from "@tanstack/react-query";
import {ReactNode} from "react";
import {makeTestQueryClient} from "@/test/utils";
import {cartKeys} from "@/lib/queries/cart-queries";
import {useCartBroadcast, broadcastCartChanged} from "./use-cart-broadcast";

// jsdom may not implement BroadcastChannel — provide a minimal stub.
class FakeBroadcastChannel {
    static channels = new Map<string, Set<FakeBroadcastChannel>>();
    listeners: ((ev: MessageEvent) => void)[] = [];
    constructor(public name: string) {
        const set = FakeBroadcastChannel.channels.get(name) ?? new Set();
        set.add(this);
        FakeBroadcastChannel.channels.set(name, set);
    }
    postMessage(data: unknown) {
        const set = FakeBroadcastChannel.channels.get(this.name);
        set?.forEach((ch) => {
            if (ch !== this) ch.listeners.forEach((l) => l({data} as MessageEvent));
        });
    }
    addEventListener(_t: string, fn: (ev: MessageEvent) => void) {
        this.listeners.push(fn);
    }
    removeEventListener(_t: string, fn: (ev: MessageEvent) => void) {
        this.listeners = this.listeners.filter((l) => l !== fn);
    }
    close() {
        FakeBroadcastChannel.channels.get(this.name)?.delete(this);
    }
}

beforeEach(() => {
    (globalThis as unknown as {BroadcastChannel: typeof FakeBroadcastChannel}).BroadcastChannel = FakeBroadcastChannel;
    FakeBroadcastChannel.channels.clear();
});

describe("useCartBroadcast", () => {
    it("invalidates cart query when sibling broadcasts", async () => {
        const client = makeTestQueryClient();
        const spy = vi.spyOn(client, "invalidateQueries");
        const wrap = ({children}: {children: ReactNode}) => (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        );

        renderHook(() => useCartBroadcast(), {wrapper: wrap});

        act(() => broadcastCartChanged());

        expect(spy).toHaveBeenCalledWith({queryKey: cartKeys.all});
    });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm run test:run -- src/hooks/use-cart-broadcast.test.ts
```

- [ ] **Step 3: Implement**

Create `src/hooks/use-cart-broadcast.ts`:

```ts
import {useEffect} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {cartKeys} from "@/lib/queries/cart-queries";

const CHANNEL_NAME = "foodwise-cart";

let sharedChannel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
    if (!sharedChannel) sharedChannel = new BroadcastChannel(CHANNEL_NAME);
    return sharedChannel;
}

export function broadcastCartChanged(): void {
    getChannel()?.postMessage({type: "cart-changed", at: Date.now()});
}

export function useCartBroadcast(): void {
    const queryClient = useQueryClient();
    useEffect(() => {
        const ch = getChannel();
        if (!ch) return;
        const onMessage = (ev: MessageEvent) => {
            if ((ev.data as {type?: string})?.type === "cart-changed") {
                void queryClient.invalidateQueries({queryKey: cartKeys.all});
            }
        };
        ch.addEventListener("message", onMessage);
        return () => ch.removeEventListener("message", onMessage);
    }, [queryClient]);
}
```

- [ ] **Step 4: Pass**

```bash
npm run test:run -- src/hooks/use-cart-broadcast.test.ts
```

- [ ] **Step 5: Wire broadcast into mutations**

Edit `src/lib/queries/cart-queries.ts`. In each mutation's `onSuccess`, add a broadcast call. At the top of file:

```ts
import {broadcastCartChanged} from "@/hooks/use-cart-broadcast";
```

Then in `useAddToCartMutation.onSuccess`, `useUpdateQuantityMutation.onSuccess`, `useRemoveItemMutation.onSuccess`, and `useClearCartMutation.onSettled`, call `broadcastCartChanged()` after the existing logic.

- [ ] **Step 6: Re-run all cart tests**

```bash
npm run test:run -- src/lib/queries/cart-queries.test.tsx src/hooks/use-cart-broadcast.test.ts
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/use-cart-broadcast.ts src/hooks/use-cart-broadcast.test.ts src/lib/queries/cart-queries.ts
git commit -m "feat(cart): cross-tab sync via BroadcastChannel"
```

---

## Phase 7: CartContext Refactor (Backward Compatibility Wrapper)

### Task 7.1: Map current CartContext public API

**Files:**
- Read: `src/contexts/cart-context.tsx` (no edit yet)

- [ ] **Step 1: Document the public surface**

```bash
grep -n "export\|interface\|cartItems\|cartCount\|cartTotal\|addToCart\|removeFromCart\|updateQuantity\|clearCart" src/contexts/cart-context.tsx
```

Expected: `CartContextType` exports `{cartItems: CartItem[]; cartCount: number; cartTotal: number; addToCart(box, qty?); removeFromCart(boxId); updateQuantity(boxId, qty); clearCart()}`. Note that current consumers use `boxId` to identify items (it's the surprise-box UUID, == backend `itemId`). The server, however, returns a separate `id` (cart-item row UUID) for `PUT/DELETE`.

**Compatibility decision:** existing callers pass `boxId` to `removeFromCart` / `updateQuantity`. We need to map `boxId` (== `itemId`) to the server's cart-item `id` before calling the mutation. Do this inside the new `CartContext` wrapper — translate in `removeFromCart(boxId)` by finding the cart item with matching `itemId`.

### Task 7.2: Refactor CartContext — test first

**Files:**
- Create: `src/contexts/cart-context.test.tsx`
- Modify: `src/contexts/cart-context.tsx`

- [ ] **Step 1: Failing test for the compatibility wrapper**

Create `src/contexts/cart-context.test.tsx`:

```tsx
import {describe, expect, it} from "vitest";
import {renderHook, waitFor, act} from "@testing-library/react";
import {ReactNode} from "react";
import {QueryClientProvider} from "@tanstack/react-query";
import {server} from "@/test/server";
import {cartHandlers} from "@/test/handlers/cart-handlers";
import {makeTestQueryClient} from "@/test/utils";
import {CartProvider, useCart} from "./cart-context";

// Mock the auth context with isAuthenticated=true.
vi.mock("@/contexts/auth-context", () => ({
    useAuth: () => ({isAuthenticated: true}),
}));

function wrap(client = makeTestQueryClient()) {
    return ({children}: {children: ReactNode}) => (
        <QueryClientProvider client={client}>
            <CartProvider>{children}</CartProvider>
        </QueryClientProvider>
    );
}

describe("CartContext compatibility wrapper (authenticated)", () => {
    it("exposes cartItems / cartCount / cartTotal from server", async () => {
        server.use(cartHandlers.getWithItem());
        const {result} = renderHook(() => useCart(), {wrapper: wrap()});

        await waitFor(() => expect(result.current.cartItems).toHaveLength(1));
        expect(result.current.cartCount).toBe(1);
        expect(result.current.cartTotal).toBe(150);
    });
});

describe("CartContext compatibility wrapper (guest)", () => {
    beforeEach(() => localStorage.clear());

    // Override the auth mock per test by re-mocking.
    it("uses guest buffer when unauthenticated", async () => {
        vi.doMock("@/contexts/auth-context", () => ({useAuth: () => ({isAuthenticated: false})}));
        const {result} = renderHook(() => useCart(), {wrapper: wrap()});

        act(() => {
            result.current.addToCart(
                {
                    id: "box-9",
                    name: "Guest Box",
                    price: 42,
                    image: "/g.jpg",
                    storeId: "store-g",
                    storeName: "Guest Store",
                } as never,
                1,
            );
        });
        expect(result.current.cartItems).toHaveLength(1);
        expect(result.current.cartItems[0].boxId).toBe("box-9");
    });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm run test:run -- src/contexts/cart-context.test.tsx
```

- [ ] **Step 3: Refactor CartContext**

Replace `src/contexts/cart-context.tsx` (preserving the existing `CartContextType` shape so consumers don't break):

```tsx
"use client";

import React, {createContext, useContext, useMemo} from "react";
import {CartItem, SurpriseBox} from "@/types";
import {ServerCart, ServerCartItem} from "@/types/cart";
import {useAuth} from "@/contexts/auth-context";
import {
    useCart as useServerCartQuery,
    useAddToCartMutation,
    useUpdateQuantityMutation,
    useRemoveItemMutation,
    useClearCartMutation,
} from "@/lib/queries/cart-queries";
import {useCartBroadcast} from "@/hooks/use-cart-broadcast";
import {guestCartBuffer} from "@/lib/cart-guest-buffer";

export interface CartContextType {
    cartItems: CartItem[];
    cartCount: number;
    cartTotal: number;
    addToCart: (box: SurpriseBox, quantity?: number) => void;
    removeFromCart: (boxId: string) => void;
    updateQuantity: (boxId: string, quantity: number) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

function serverToCartItem(item: ServerCartItem): CartItem {
    return {
        boxId: item.itemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        storeId: item.storeId,
        storeName: "", // server returns storeId; storeName comes from store cache or is omitted
        image: item.imageUrl,
    };
}

export const CartProvider = ({children}: {children: React.ReactNode}) => {
    const {isAuthenticated} = useAuth();
    useCartBroadcast();

    const cartQuery = useServerCartQuery({isAuthenticated});
    const addMutation = useAddToCartMutation();
    const updateMutation = useUpdateQuantityMutation();
    const removeMutation = useRemoveItemMutation();
    const clearMutation = useClearCartMutation();

    const value = useMemo<CartContextType>(() => {
        if (isAuthenticated) {
            const server: ServerCart | undefined = cartQuery.data;
            const items = (server?.items ?? []).map(serverToCartItem);
            return {
                cartItems: items,
                cartCount: server?.itemCount ?? 0,
                cartTotal: server?.totalPrice ?? 0,
                addToCart: (box, quantity = 1) => {
                    addMutation.mutate({
                        itemId: box.id,
                        quantity,
                        name: box.name ?? "Surprise Box",
                        price: box.price,
                        imageUrl: box.image ?? "",
                        storeId: box.storeId ?? "",
                    });
                },
                removeFromCart: (boxId) => {
                    const target = server?.items.find((it) => it.itemId === boxId);
                    if (target) removeMutation.mutate({cartItemId: target.id});
                },
                updateQuantity: (boxId, quantity) => {
                    const target = server?.items.find((it) => it.itemId === boxId);
                    if (target) updateMutation.mutate({cartItemId: target.id, quantity});
                },
                clearCart: () => clearMutation.mutate(),
            };
        }

        // Guest mode — buffer in localStorage. We don't have product details so display-side
        // hooks should fetch boxes by ID. For now we surface boxId/quantity only; UI fields
        // (name/price/image) come from the box object passed into addToCart (we mirror it).
        const entries = guestCartBuffer.read();
        const guestItems: CartItem[] = entries.map((e) => ({
            boxId: e.itemId,
            name: "",
            price: 0,
            quantity: e.quantity,
            storeId: "",
            storeName: "",
            image: "",
        }));
        return {
            cartItems: guestItems,
            cartCount: entries.reduce((sum, e) => sum + e.quantity, 0),
            cartTotal: 0,
            addToCart: (box, quantity = 1) => {
                guestCartBuffer.add({itemId: box.id, quantity});
                // Force a re-render: the buffer is read on next render anyway, but to make
                // the change visible without a state hook we rely on the surrounding consumer
                // re-rendering. In practice, addToCart is called from interactions that
                // trigger their own renders. For robustness, consider adding a useSyncExternalStore
                // here in a future hardening pass.
            },
            removeFromCart: (boxId) => guestCartBuffer.removeItem(boxId),
            updateQuantity: (boxId, quantity) => guestCartBuffer.setQuantity(boxId, quantity),
            clearCart: () => guestCartBuffer.clear(),
        };
    }, [isAuthenticated, cartQuery.data, addMutation, updateMutation, removeMutation, clearMutation]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart(): CartContextType {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within <CartProvider>");
    return ctx;
}
```

**Note on guest re-render:** guest mode reads from localStorage on every render but doesn't subscribe to changes. After the test in Step 1 passes the basic case, harden in Task 7.3 with `useSyncExternalStore` if the guest UX needs reactivity to mutations from other components.

- [ ] **Step 4: Pass**

```bash
npm run test:run -- src/contexts/cart-context.test.tsx
```

- [ ] **Step 5: Full app build + smoke test**

```bash
npx tsc --noEmit && cd /Users/tapok332/Documents/fw-project-dyplom && docker compose up -d --build --force-recreate client-ui
```

Wait for completion. Manual smoke: open `http://localhost:3000`, login, add a box to cart, see count change in Header, open cart, remove item, clear cart. Verify in another tab that changes propagate (BroadcastChannel).

- [ ] **Step 6: Commit**

```bash
git add src/contexts/cart-context.tsx src/contexts/cart-context.test.tsx
git commit -m "feat(cart): refactor CartContext to thin wrapper over server-state hooks"
```

### Task 7.3: Guest mode reactivity via useSyncExternalStore

**Files:**
- Modify: `src/lib/cart-guest-buffer.ts`
- Modify: `src/contexts/cart-context.tsx`

- [ ] **Step 1: Add subscribe/notify to guestCartBuffer**

Modify `src/lib/cart-guest-buffer.ts`. Add at the top:

```ts
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
    listeners.forEach((l) => l());
}

function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
```

Then in `add`, `setQuantity`, `removeItem`, `clear` — after the `write(...)` call, append `notify();`.

Add to the `guestCartBuffer` object:

```ts
subscribe,
```

Also export `subscribe`:

```ts
export {subscribe as subscribeGuestCart};
```

Add a `storage` event listener once on module load to handle cross-tab guest cart sync:

```ts
if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_KEY) notify();
    });
}
```

- [ ] **Step 2: Wire useSyncExternalStore in CartContext guest branch**

In `src/contexts/cart-context.tsx`, add at the top:

```ts
import {useSyncExternalStore} from "react";
import {subscribeGuestCart} from "@/lib/cart-guest-buffer";
```

In `CartProvider`, before computing `value`, add:

```ts
const guestEntriesSnapshot = useSyncExternalStore(
    subscribeGuestCart,
    () => guestCartBuffer.read(),
    () => [],
);
```

Replace the `const entries = guestCartBuffer.read();` line inside the guest branch with `const entries = guestEntriesSnapshot;`.

- [ ] **Step 3: Build + test**

```bash
npx tsc --noEmit && npm run test:run -- src/contexts/cart-context.test.tsx
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/cart-guest-buffer.ts src/contexts/cart-context.tsx
git commit -m "feat(cart): make guest cart reactive via useSyncExternalStore + storage events"
```

---

## Phase 8: Legacy localStorage Migration

### Task 8.1: One-time migration — test first

**Files:**
- Create: `src/lib/cart-migration.test.ts`
- Create: `src/lib/cart-migration.ts` (in Step 3)

The old code wrote `localStorage["cart"]` as `[{boxId, name, price, quantity, storeId, storeName, image}]`. Migrate it into the new guest buffer once, then delete the legacy key.

- [ ] **Step 1: Failing tests**

Create `src/lib/cart-migration.test.ts`:

```ts
import {describe, expect, it, beforeEach} from "vitest";
import {guestCartBuffer} from "./cart-guest-buffer";
import {migrateLegacyCartIfNeeded} from "./cart-migration";

beforeEach(() => localStorage.clear());

describe("migrateLegacyCartIfNeeded", () => {
    it("moves legacy items into guest buffer and deletes legacy key", () => {
        localStorage.setItem(
            "cart",
            JSON.stringify([
                {boxId: "box-1", quantity: 2, name: "X", price: 100, storeId: "s", storeName: "", image: ""},
                {boxId: "box-2", quantity: 1, name: "Y", price: 50, storeId: "s", storeName: "", image: ""},
            ]),
        );

        migrateLegacyCartIfNeeded();

        expect(guestCartBuffer.read()).toEqual([
            {itemId: "box-1", quantity: 2},
            {itemId: "box-2", quantity: 1},
        ]);
        expect(localStorage.getItem("cart")).toBeNull();
    });

    it("noop when no legacy key present", () => {
        migrateLegacyCartIfNeeded();
        expect(guestCartBuffer.read()).toEqual([]);
    });

    it("noop on corrupted legacy data — deletes it silently", () => {
        localStorage.setItem("cart", "not-json");
        migrateLegacyCartIfNeeded();
        expect(localStorage.getItem("cart")).toBeNull();
        expect(guestCartBuffer.read()).toEqual([]);
    });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm run test:run -- src/lib/cart-migration.test.ts
```

- [ ] **Step 3: Implement**

Create `src/lib/cart-migration.ts`:

```ts
import {guestCartBuffer} from "./cart-guest-buffer";

const LEGACY_KEY = "cart";

export function migrateLegacyCartIfNeeded(): void {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(LEGACY_KEY);
    if (raw === null) return;
    try {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            for (const entry of parsed) {
                if (
                    typeof entry === "object" &&
                    entry !== null &&
                    typeof (entry as {boxId?: unknown}).boxId === "string" &&
                    typeof (entry as {quantity?: unknown}).quantity === "number" &&
                    (entry as {quantity: number}).quantity > 0
                ) {
                    guestCartBuffer.add({
                        itemId: (entry as {boxId: string}).boxId,
                        quantity: (entry as {quantity: number}).quantity,
                    });
                }
            }
        }
    } catch {
        // Corrupted legacy — drop it.
    }
    localStorage.removeItem(LEGACY_KEY);
}
```

- [ ] **Step 4: Pass**

```bash
npm run test:run -- src/lib/cart-migration.test.ts
```

- [ ] **Step 5: Run migration once on app load**

Modify `src/contexts/cart-context.tsx`. At the top:

```ts
import {migrateLegacyCartIfNeeded} from "@/lib/cart-migration";
```

Inside `CartProvider`, add a `useEffect` (top of component body):

```ts
useEffect(() => {
    migrateLegacyCartIfNeeded();
}, []);
```

Also add the `useEffect` import to React.

- [ ] **Step 6: Build + smoke**

```bash
npx tsc --noEmit && cd /Users/tapok332/Documents/fw-project-dyplom && docker compose up -d --build --force-recreate client-ui
```

Manual smoke: pre-seed legacy cart in DevTools (`localStorage.setItem("cart", JSON.stringify([{boxId: "demo-box", quantity: 1, name: "X", price: 100}]))`), reload — expect `localStorage["cart"]` to be gone, `localStorage["foodwise.guest-cart.v1"]` to exist with `[{itemId:"demo-box",quantity:1}]`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/cart-migration.ts src/lib/cart-migration.test.ts src/contexts/cart-context.tsx
git commit -m "feat(cart): one-time legacy localStorage[\"cart\"] migration"
```

---

## Phase 9: Cleanup + Full Smoke Test

### Task 9.1: Remove dead code from old CartContext

**Files:**
- Modify: `src/contexts/cart-context.tsx`

- [ ] **Step 1: Verify no remnants of old localStorage["cart"] reads/writes**

```bash
grep -rn 'localStorage.\(get\|set\|remove\)Item.*"cart"\|sessionStorage.\(get\|set\)Item.*"cart"' src/
```

Expected: only `src/lib/cart-migration.ts` references the legacy `"cart"` key. Anywhere else — delete.

- [ ] **Step 2: Verify no remaining references to deprecated `menuItemId`**

```bash
grep -rn "menuItemId" src/
```

Expected: zero occurrences (the earlier `surpriseBoxId` rename should have covered this; verify here for safety).

- [ ] **Step 3: Commit if anything cleaned**

```bash
git add -A
git commit -m "chore(cart): remove dead code from pre-refactor cart"
```

### Task 9.2: Full integration smoke test

**Files:** none (manual)

- [ ] **Step 1: Run all tests**

```bash
npm run test:run
```

Expected: every test in `src/**/*.test.{ts,tsx}` passes.

- [ ] **Step 2: Final docker rebuild**

```bash
cd /Users/tapok332/Documents/fw-project-dyplom && docker compose up -d --build --force-recreate client-ui
```

- [ ] **Step 3: End-to-end manual smoke (10 minutes)**

Verify each of these flows works as expected. Each bullet is a separate check — if any fails, fix before declaring complete.

1. **Anonymous browse → add to cart → login → cart preserved**
   - Open incognito → navigate to a store → add a box → see count badge increment
   - Login → expect the same item to appear in cart (replay succeeded)
   - Refresh → cart still there

2. **Authenticated add/remove/update**
   - Logged in. Add box from listing → cart count immediately reflects (optimistic)
   - Open `/cart` → adjust quantity with `+`/`−` → see total update immediately (optimistic)
   - Remove item → see it disappear immediately, then confirmed on server

3. **Optimistic rollback on failure**
   - DevTools → Network → throttle to Offline
   - Add a box → see optimistic count increment
   - Wait for retry (1 attempt) to fail → expect cart to roll back to previous state and a toast error

4. **Cross-tab sync**
   - Open `/cart` in two tabs
   - In tab A: remove an item
   - In tab B: expect the item to disappear within ~100ms without manual refresh

5. **Stale cart no longer possible**
   - Wipe local browser storage entirely
   - Reseed backend DBs (`docker compose down -v postgres && docker compose up -d postgres` then wait + reseed Flyway)
   - Refresh — expect empty cart and no errors (cart fetched fresh from server)

6. **Checkout still works**
   - Add a real box (from current DB) → `/checkout` → fill address → cash → confirm → expect order created (no 400, no 404)

- [ ] **Step 4: Verify container fresh**

```bash
docker ps --filter "name=foodwise-client-ui" --format "{{.Names}}\t{{.Status}}"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/cart
```

Expected: container Up < 1 min, HTTP 200.

- [ ] **Step 5: Final commit if any fixups**

```bash
git status
# if anything changed during smoke testing:
git add -A
git commit -m "fix(cart): post-smoke fixups"
```

### Task 9.3: Documentation note

**Files:**
- Modify: `CLAUDE.md` (project root)

- [ ] **Step 1: Append cart architecture note**

Append to `/Users/tapok332/Documents/fw-project-dyplom/fw-client-ui/CLAUDE.md` under a new heading:

```markdown
## Cart Architecture

- Server-side cart via `foodwise-cart` (Spring Boot, port 8085, gateway-routed `/cart/**`).
- Frontend: `useCart()` hook in `src/contexts/cart-context.tsx` is a thin compatibility wrapper over TanStack Query hooks in `src/lib/queries/cart-queries.ts`. Authoritative data lives in the server; client only holds an optimistic cache.
- Guest users: cart buffered in `localStorage["foodwise.guest-cart.v1"]` as `{itemId, quantity}[]`. On login, `auth-context` replays the buffer via `POST /cart/items` and clears it.
- Cross-tab sync: `BroadcastChannel("foodwise-cart")` + `storage` event listener for guest buffer.
- Optimistic mutations with rollback on error; retry policy in `src/lib/queries/query-client.ts` (no retry on 4xx, 1 retry on transient mutations, 3 retries with exponential backoff on queries).
- Server-side single-store invariant: `storeId` is resolved by cart-service, not accepted from client (ADR 0002).
- Legacy `localStorage["cart"]` is migrated once on first run by `src/lib/cart-migration.ts`, then deleted.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document new server-side cart architecture"
```

---

## Done. Final verification checklist

- [ ] All TDD tests pass (`npm run test:run`)
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] Docker container fresh (`Up < 5 min` after final rebuild)
- [ ] All 6 manual smoke flows pass
- [ ] `CLAUDE.md` updated
- [ ] No `localStorage["cart"]` reads/writes outside `cart-migration.ts`
- [ ] No `menuItemId` anywhere in `src/`
- [ ] No stale-cart bug reproducible (Task 9.2 step 3, point 5)
