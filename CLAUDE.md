# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server with Turbopack on port 9002
- `npm run build` — production build
- `npm start` — production server
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check (tsc --noEmit)
- `npm run genkit:dev` — Google Genkit AI dev mode
- `npm run genkit:watch` — Genkit with file watching

## Architecture

Next.js 15 App Router, React 18, TypeScript. All page/component files use `"use client"`.

### State Management — React Context (no Redux/Zustand)

Providers are nested in `src/app/layout.tsx`: UtilsProvider → LocaleProvider → AuthProvider → DataProvider → CartProvider.

- **AuthContext** (`src/contexts/auth-context.tsx`) — JWT auth with automatic token refresh 60s before expiry. Access token in memory only; refresh token in httpOnly cookie set by fw-auth-service (ADR 0013). Session restored on reload via silent refresh gated by `localStorage["fw.auth.session-hint"]` (non-secret flag). No JWT ever touches localStorage.
- **CartContext** (`src/contexts/cart-context.tsx`) — cart state, persisted to localStorage + sessionStorage.
- **DataContext** (`src/contexts/data-context.tsx`) — global data: boxes, stores, orders. Coordinates API calls.
- **LocaleContext** (`src/contexts/locale-context.tsx`) — i18n (uk/en). `t(section, key)` function. Translations live in `src/lib/translations.ts`.
- **MapContext** (`src/contexts/map-context.tsx`) — map state.
- **UtilsProvider** (`src/lib/utils-context.tsx`) — shared formatting, hero images, category icons.

Each context follows the pattern: createContext → Provider component → `useXxx()` hook with guard.

### API Layer

- **`src/lib/api.ts`** — fetch wrapper with 5s response cache, request deduplication, retry logic, global failure tracking. Namespace: `api.boxes.getAll()`, `api.stores.getNearby()`, `api.categories.getAll()`, etc.
- **`src/lib/auth-api.ts`** — login/register/refreshToken. Schedules automatic refresh.
- **`src/lib/auth-http-client.ts`** — fetch wrapper injecting Bearer token, handles 401 with token refresh. Methods: `get()`, `post()`, `put()`, `delete()`.
- **`src/services/api-service.ts`** — business logic (nearby restaurants, PostGIS distance calculations).
- **`src/services/liqpay.ts`, `binance-pay.ts`** — payment integrations.

Backend API base URL: `API_BASE_URL` env var (default `http://localhost:8082`).

### UI Stack

- **Tailwind CSS** with HSL CSS variable color system (primary = forest green). Dark mode via `.dark` class.
- **Radix UI** primitives + shadcn/ui-style wrappers in `src/components/ui/`.
- **Framer Motion** for animations, **Lucide React** for icons, **Swiper** for carousels.
- **React Hook Form + Zod** for forms and validation.

### Key Integrations

- **Google Maps** via `@vis.gl/react-google-maps` + custom styles (`gmaps-styles.ts`). Also React Leaflet.
- **Google Genkit AI** — box description generation (`src/ai/`). Requires `GOOGLE_GENAI_API_KEY`.
- **Firebase** — used via adapter with TanStack React Query.

### Path Alias

`@/*` maps to `./src/*` (tsconfig.json).

## Environment Variables

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Google Maps
- `API_BASE_URL` — backend API (default: http://localhost:8082)
- `GOOGLE_GENAI_API_KEY` — Genkit AI
- `GCP_CREDENTIALS_JSON`, `GCP_STORAGE_BUCKET` — GCP/Cloud Storage

## Deployment

Docker + GitHub Actions → GCP Cloud Run. Dockerfile in repo root.

## Design Context

**Brand:** Earthy, generous, honest. Feels like a local farmer's market, not a tech startup.

**Aesthetic:** Organic Biophilic — nature-inspired, warm cream backgrounds (#FBF9F6), forest green primary (#1E7A3A), orange accent (#E88A2D), green-tinted shadows, 16px radius, leaf motifs.

**Typography:** Distinctive serif + sans pair with cyrillic. Current Lora + Raleway flagged as overused — replacement planned.

**References:** Too Good To Go, Bolt Food, Glovo.

**Accessibility:** WCAG AAA target (7:1 contrast). Full keyboard nav, aria-labels, prefers-reduced-motion.

**Principles:** Earthy warmth, mobile-first impulse, eco-storytelling, frictionless discovery, Ukrainian-first.

Full design context: `.impeccable.md`

## Cart Architecture (added 2026-05-24 by server-side cart refactor)

- **Server-side cart** via `foodwise-cart` (Spring Boot, port 8085, gateway-routed `/cart/**`). Server is source of truth for authenticated users.
- **Frontend layer:** `useCart()` hook in `src/contexts/cart-context.tsx` is a thin compatibility wrapper over TanStack Query hooks in `src/lib/queries/cart-queries.ts`. Authoritative cart lives in the server; the client only holds an optimistic cache (TanStack Query).
- **Guest users:** cart buffered in `localStorage["foodwise.guest-cart.v1"]` as `{itemId, quantity}[]`. On login, `auth-context` replays the buffer via `POST /cart/items` (best-effort: 4xx items are dropped, network failures retry) and clears it.
- **Cross-tab sync:** `BroadcastChannel("foodwise-cart")` notifies sibling tabs to invalidate; `storage` event listener handles guest buffer cross-tab. `useSyncExternalStore` provides React reactivity for guest mode.
- **Optimistic mutations with rollback** on error; retry policy in `src/lib/queries/query-client.ts`:
  - Queries: no retry on 4xx, up to 3 retries on network/5xx with exponential backoff (capped 8s).
  - Mutations: never retry validation errors; 1 retry on transient network failures.
- **Single-store invariant:** `storeId` is resolved by cart-service, not accepted from client (ADR 0002).
- **Legacy migration:** `localStorage["cart"]` (pre-refactor) is migrated once on first mount by `src/lib/cart-migration.ts`, then deleted.
- **Known carry-forward items:**
  - [SHOULD-FIX] `onSettled` in mutations has a `if (!error)` guard — workaround for MSW `onUnhandledRequest: "error"`. On production mutation error the cart is NOT re-fetched; rollback state is final. Acceptable for v1.
  - [CONSIDER] Add a merge-branch test for `useAddToCartMutation` (same itemId added twice → quantity increments).
  - ~~[SHOULD-FIX] `setUser(...)` not called after fresh login~~ — fixed 2026-06-12 as part of the ADR 0013 auth rework (login/register/google now call `setUser`).
