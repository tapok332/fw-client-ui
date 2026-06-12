# fw-client-ui

[← FoodWise platform overview](https://github.com/tapok332/foodwise-platform)

Consumer-facing web application for the FoodWise food-rescue marketplace.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Port](https://img.shields.io/badge/port-3000-green)

---

## Overview

FoodWise is a food-rescue marketplace where consumers buy **surprise boxes** of
unsold-but-still-good food from local bakeries, restaurants, and grocery stores
at 30–70% off retail price.

This app is a **mobile-first consumer PWA** covering the full purchase journey:

1. **Discover** — browse the home feed, category filters, and a live map of nearby stores
2. **Browse** — explore a store page or individual surprise box detail
3. **Cart** — add items, review the order, apply a pickup window
4. **Checkout** — pay with Stripe card, LiqPay, or Binance Pay
5. **Pickup** — show the QR/code at the store counter

The interface is **bilingual** (Ukrainian default, English secondary) with
locale switching available in-app. Copy follows a warm, honest brand voice —
no dark patterns, no aggressive discount framing.

---

## Engineering Highlights

### Server-side cart with TanStack Query

Cart state is authoritative on the server (`fw-cart-service` via gateway `/cart/**`).
The client holds only an optimistic cache managed by TanStack Query v5.

- `src/lib/queries/cart-queries.ts` — `useCart`, `useAddToCartMutation`,
  `useUpdateQuantityMutation`, `useRemoveItemMutation`. All mutations apply
  an optimistic update and roll back on error.
- `src/lib/queries/query-client.ts` — retry policy: no retry on 4xx, up to 3
  retries on network/5xx with exponential backoff capped at 8s; mutations never
  retry validation errors.
- `src/lib/queries/cart-queries.test.tsx` — Vitest + MSW unit tests covering
  the mutation/rollback cycle.

### Guest-cart buffer with login replay

Unauthenticated users' cart is persisted in `localStorage["foodwise.guest-cart.v1"]`
as `{itemId, quantity}[]`. On successful login, `src/contexts/auth-context.tsx`
replays the buffer item-by-item via `POST /cart/items` (best-effort: 4xx items
are silently dropped, transient network failures get one retry), then clears the
key. Legacy `localStorage["cart"]` keys from a pre-refactor era are migrated
once on first mount by `src/lib/cart-migration.ts` and deleted.

### Cross-tab cart sync

A `BroadcastChannel("foodwise-cart")` notifies sibling tabs to invalidate the
TanStack Query `["cart"]` key when the cart changes. A `storage` event listener
handles cross-tab propagation in guest mode. React reactivity in guest mode uses
`useSyncExternalStore`.

### XSS-safe token storage with silent session restore

No JWT ever touches `localStorage` (ADR 0013). The access token lives only in
module-level memory (`src/lib/auth-api.ts`); the refresh token is an httpOnly
`SameSite=Strict` cookie set by the auth service, invisible to JavaScript.
Sessions survive reloads via a silent `POST /auth/refresh-token` on app start,
gated by a non-secret `localStorage["fw.auth.session-hint"]` flag so anonymous
visitors never fire the call.

### JWT auto-refresh

`src/lib/auth-api.ts` schedules a proactive token refresh 60 seconds before the
JWT expires, with a single-flight guard (concurrent 401s trigger exactly one
refresh — the backend rotates the refresh token, so parallel refreshes would
invalidate each other) and a circuit breaker after three consecutive failures.
`src/lib/auth-http-client.ts` injects the Bearer token on every authenticated
request and handles 401 responses by refreshing once before retrying. Logout
calls `POST /auth/logout` so the server revokes the refresh token and clears
its cookie.

### API layer with caching, deduplication, and retry

`src/lib/api.ts` is a typed fetch wrapper with:

- 5-second in-memory response cache (keyed by URL + params)
- In-flight request deduplication (identical concurrent calls share one fetch)
- Automatic retry with exponential backoff on network/5xx failures
- Backend-to-frontend field mappers (`mapStoreImageFields`, `mapSurpriseBoxFields`)
  that translate backend snake_case and renamed fields to the frontend type contract

`src/lib/auth-api.ts` handles login, register, token refresh, and logout
separately and shares the same retry/backoff primitives. All auth calls run
with `credentials: 'include'` so the httpOnly refresh cookie travels with them.

### Stripe Elements checkout

`@stripe/react-stripe-js` and `@stripe/stripe-js` are both in production
dependencies. The checkout flow conditionally renders Stripe Elements when
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set; if the key is absent the checkout
falls back gracefully to cash-at-pickup with a visible notice.
`src/services/liqpay.ts` and `src/services/binance-pay.ts` provide additional
payment adapters.

### Zod validation

`zod` is used for form validation (via `@hookform/resolvers/zod`) across all
user-facing forms: login, registration, address, checkout. API response parsing
uses Zod schemas to catch backend schema drift at the boundary rather than in
components.

### Design system

Organic Biophilic visual language — warm cream backgrounds, forest green primary,
green-tinted layered shadows, Vollkorn serif headings, Rubik body.
See [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) for the full token and component spec.

---

## Screens / Features

| Route | Description |
|---|---|
| `/` | Home feed — hero, category carousel, nearby stores, featured surprise boxes |
| `/category/[slug]` | Filtered store list by category |
| `/store/[id]` | Store detail — info, menu items, surprise boxes |
| `/cart` | Cart review with item controls and subtotal |
| `/checkout` | Pickup window selection, payment method, order placement |
| `/orders` | Order history |
| `/orders/[id]` | Order detail with pickup code / QR |
| `/favorites` | Saved stores and boxes |
| `/profile` | Account info, saved addresses, payment methods |
| `/login` | Email/password + Sign in with Google |
| `/addresses` | Address management |
| `/payment-methods` | Saved cards |

---

## Project Structure

```
src/
├── app/              # Next.js App Router — page.tsx + layout.tsx per route
│   ├── cart/
│   ├── checkout/
│   ├── category/[slug]/
│   ├── orders/
│   ├── store/[id]/
│   ├── profile/
│   ├── favorites/
│   └── ...
├── components/       # UI components grouped by domain
│   ├── ui/           # Radix/shadcn primitives (Button, Dialog, Toast…)
│   ├── home/         # Hero, CategoryRow, FeaturedBoxes
│   ├── store/        # StoreCard, SurpriseBoxCard, StoreHero
│   ├── cart/         # CartItem, CartSummary
│   ├── checkout/     # PaymentForm, PickupWindow
│   ├── header/       # GlobalHeader, navigation
│   └── ...
├── contexts/         # React Contexts (Auth, Cart, Data, Locale, Map)
├── hooks/            # Custom hooks (useCartBroadcast, useSyncGuest…)
├── lib/
│   ├── api.ts        # Typed fetch wrapper + backend-field mappers
│   ├── auth-api.ts   # Login / register / refresh / logout, in-memory token store
│   ├── auth-http-client.ts  # Authenticated fetch with 401 retry
│   ├── cart-api.ts   # Cart REST client
│   ├── cart-migration.ts    # One-time localStorage migration
│   ├── queries/      # TanStack Query hooks (cart, orders, favorites)
│   ├── translations.ts      # uk/en string catalogue
│   └── utils.ts      # Formatting, Money arithmetic, cn()
├── services/         # External integrations (LiqPay, Binance Pay, PostGIS utils)
├── ai/               # Google Genkit — box description generation (server-side)
├── types/            # Shared TypeScript interfaces (Cart, Store, Box, Money…)
├── providers/        # TanStack QueryClientProvider wrapper
└── test/             # MSW server setup + RTL render helpers
```

---

## Configuration

| Variable | Where resolved | Purpose |
|---|---|---|
| `API_BASE_URL` | Server-side (SSR + API routes) | Spring Cloud Gateway base URL. Default: `http://localhost:8080`. In Docker Compose: `http://gateway:8080`. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Build-time (`--build-arg`) | Stripe publishable key. Empty value disables online payment gracefully. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Build-time (`--build-arg`) | Google OAuth Client ID. Empty value disables Sign in with Google button. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Runtime | Google Maps JS API key for the store map. |
| `NEXT_PUBLIC_DEFAULT_LAT` | Build-time | Default map center latitude (default: `50.4501` — Kyiv). |
| `NEXT_PUBLIC_DEFAULT_LNG` | Build-time | Default map center longitude (default: `30.5234`). |
| `GOOGLE_GENAI_API_KEY` | Server-side | Google Genkit AI for box description generation (`src/ai/`). |
| `GCP_CREDENTIALS_JSON` | Server-side | GCP service account credentials for Cloud Storage. |
| `GCP_STORAGE_BUCKET` | Server-side | GCP Cloud Storage bucket name for image uploads. |

---

## Running

### Full stack (recommended)

From the project root, bring up the entire platform:

```bash
docker compose up
```

The consumer app is available at **http://localhost:3000**.
The service connects to the Spring Cloud Gateway at `http://gateway:8080` inside
the compose network.

### Development mode

```bash
cd fw-client-ui
npm install
npm run dev          # Turbopack dev server on port 9002
```

Set `API_BASE_URL=http://localhost:8080` in a local `.env.local` file to point
at a running gateway.

### Additional commands

```bash
npm run build        # Production build (Next.js standalone output)
npm start            # Serve the production build on port 3000
npm run lint         # ESLint (src/)
npm run typecheck    # TypeScript strict check (tsc --noEmit)
```

---

## Testing

The project uses **Vitest** + **React Testing Library** + **MSW v2**.

```bash
npm test             # Watch mode
npm run test:run     # Single run (CI)
npm run test:ui      # Vitest UI browser dashboard
```

Test files:

- `src/lib/queries/cart-queries.test.tsx` — TanStack Query mutation hooks,
  optimistic update, and rollback under simulated network errors
- `src/contexts/cart-context.test.tsx` — CartContext integration: guest buffer,
  BroadcastChannel sync, login replay

MSW handlers live in `src/test/handlers/` and are wired up in `src/test/server.ts`.
`vitest.setup.ts` starts the server before each suite and resets handlers after
each test.

---

## Design System

The visual language — palette, typography, motion tokens, shadow scale, component
patterns — is documented in [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md). That file is
the single source of truth for brand decisions and should be consulted before
adding new UI components or modifying visual tokens.
