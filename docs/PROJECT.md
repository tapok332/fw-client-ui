# FoodWise — Project Documentation

## Overview

**FoodWise** — web-application for food rescue. Users purchase "surprise boxes" of unsold food from restaurants and
stores at 30-70% discount. Ukrainian-market focused MVP (PWA, mobile-first).

**Mission:** "Save Food. Save Money. Save the Planet."

**Analogue:** Too Good To Go, but for Ukrainian market.

---

## Target Audience

- **Consumers** — budget-conscious, eco-aware users seeking deals on fresh food
- **Merchants** — restaurants and retailers who want to reduce waste and monetize unsold inventory
- **Geo-focus** — Kyiv, Ukraine (default coordinates: 50.4501N, 30.5234E)

---

## Key Features

| Feature                                                              | Status          |
|----------------------------------------------------------------------|-----------------|
| Surprise box browsing by category and distance                       | Done            |
| JWT authentication (login/register + auto-refresh 60s before expiry) | Done            |
| Shopping cart (persisted to localStorage + sessionStorage)           | Done            |
| Multi-step checkout (delivery -> payment -> confirmation)            | Done            |
| User profile with eco-statistics (money saved, CO2 reduced)          | Done            |
| Address and payment method management (CRUD)                         | Done            |
| Store map (Google Maps + MarkerClusterer)                            | Done            |
| Dark theme + i18n (uk/en)                                            | Done            |
| AI box description generator (Google Genkit)                         | Done            |
| Referral system and promo codes                                      | Mock            |
| Payment (LiqPay, Binance Pay)                                        | Stubs           |
| Search                                                               | Stub            |
| Real-time order tracking                                             | Not implemented |
| Push/email notifications                                             | Not implemented |
| Merchant dashboard                                                   | Not implemented |

---

## Pages (18 routes)

### Public

| Route               | Purpose                                                               |
|---------------------|-----------------------------------------------------------------------|
| `/`                 | Home: hero carousel, category chips, surprise box feed, nearby stores |
| `/login`            | Login form (email/password + Google OAuth stub)                       |
| `/register`         | Registration (email, password, name)                                  |
| `/restaurants`      | Restaurant directory with map view and filters                        |
| `/search`           | Search (stub)                                                         |
| `/category/[slug]`  | Filtered boxes by cuisine type                                        |
| `/stores/[storeId]` | Store detail: menu, boxes, location                                   |
| `/support`          | Help/FAQ page                                                         |
| `/invite`           | Referral code sharing                                                 |
| `/activate-code`    | Promo code entry                                                      |

### Protected (require auth)

| Route                    | Purpose                                          |
|--------------------------|--------------------------------------------------|
| `/profile`               | User dashboard: avatar, eco-stats, recent orders |
| `/profile/edit`          | Edit name, email, preferences                    |
| `/cart`                  | Shopping cart with checkout CTA                  |
| `/checkout`              | Multi-step: delivery type -> payment -> address  |
| `/checkout/confirmation` | Order success with pickup code + confetti        |
| `/orders`                | Order list                                       |
| `/orders/[id]`           | Order details with status, items, pickup code    |
| `/orders/history`        | Completed/cancelled orders                       |
| `/addresses`             | Saved delivery addresses                         |
| `/payment-methods`       | Saved payment methods                            |

---

## Data Model

### SurpriseBox

```
id, name, description, image, discount, timeLeft, category,
price, retailPrice, currency, distanceKm, stock,
pickup: {from, to}, deliveryAvailable, rating,
storeId, storeName, storeImage, location: {latitude, longitude}
```

### Store (StoreDetail)

```
id, name, logoUrl, heroUrl, category, rating, address,
coordinates: {lat, lng}, distance, minOrderAmount,
opensAt, closesAt, tags, paymentMethods,
phone, website, surpriseBox, menu[], items{}, combos[]
```

### Order

```
id, status: PENDING|PROCESSING|READY|COMPLETED|CANCELLED,
createdAt, pickupCode, storeName, storeId,
items: [{id, menuItemId, name, price, quantity, imageUrl}],
totalPrice, ecoImpact: {moneySaved, co2ReducedKg},
paymentType, deliveryType, deliveryAddress
```

### User Profile (ProfileDto)

```
id, name, email, avatar, preferences,
statistics: {ordersCompleted, itemsSaved, savings},
paymentMethods[], addresses[], referralCode,
referralStats: {invitedCount, pendingRewards, totalEarned}
```

### Address

```
id, title, fullAddress, street, city, state, postalCode,
country, addressType: HOME|WORK|OTHER,
coordinates: {latitude, longitude}, isDefault
```

---

## Tech Stack

| Layer            | Technology                                                   |
|------------------|--------------------------------------------------------------|
| Framework        | Next.js 15 (App Router), React 18, TypeScript                |
| Styling          | Tailwind CSS, Framer Motion, Lucide Icons                    |
| UI Components    | Radix UI primitives + shadcn/ui wrappers                     |
| Forms            | React Hook Form + Zod validation                             |
| State Management | React Context (6 providers, no Redux)                        |
| Maps             | Google Maps API (`@vis.gl/react-google-maps`), React Leaflet |
| AI               | Google Genkit (text generation for box descriptions)         |
| Payments         | LiqPay, Binance Pay (stubs)                                  |
| Auth             | JWT tokens in localStorage, auto-refresh                     |
| Build            | Turbopack (dev), Next.js build (prod)                        |
| Deployment       | Docker -> GitHub Actions -> Google Cloud Run                 |

### Context Providers (nesting order)

```
UtilsProvider -> LocaleProvider -> AuthProvider -> DataProvider -> CartProvider
```

### API Layer (`src/lib/api.ts`)

- Base URL: `API_BASE_URL` env var (default: `http://localhost:8080`)
- Features: 5s response cache, request deduplication, retry logic, 10s timeout
- Auth: Bearer token auto-injection, 401 -> refresh -> retry
- Namespaces: `api.boxes`, `api.stores`, `api.categories`, `api.orders`, `api.user`, `api.addresses`,
  `api.paymentMethods`, `api.auth`

---

## Design System

### Style Direction: Organic Biophilic

Natural, warm, sustainable aesthetic inspired by nature. Rounded organic shapes, earth tones, calming feel. No sharp
edges, no cold corporate look.

### Typography

| Role             | Font                      | Source                                  |
|------------------|---------------------------|-----------------------------------------|
| Headings (h1-h6) | **Vollkorn** (serif)      | Google Fonts, subsets: latin + cyrillic |
| Body text        | **Rubik** (sans-serif)    | Google Fonts, subsets: latin + cyrillic |

**Implementation:**

```css
body {
    font-family: var(--font-body), 'Rubik', sans-serif;
}

h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading), 'Vollkorn', serif;
}
```

In components: `font-[family-name:var(--font-heading)]` for Vollkorn, default for Rubik.

### Color Palette

#### Light Mode

| Token                  | HSL         | Hex     | Usage                                   |
|------------------------|-------------|---------|-----------------------------------------|
| `--background`         | 40 33% 98%  | #FBF9F6 | Warm cream page background              |
| `--foreground`         | 150 20% 15% | #1F2E21 | Dark forest text                        |
| `--primary`            | 145 63% 32% | #1E7A3A | Forest green (CTA, links, accents)      |
| `--primary-foreground` | 0 0% 100%   | #FFFFFF | Text on primary                         |
| `--secondary`          | 40 20% 94%  | #F2EEE8 | Warm beige backgrounds                  |
| `--muted`              | 40 15% 93%  | #EDEBE7 | Muted warm backgrounds                  |
| `--muted-foreground`   | 150 5% 45%  | #6B7368 | Secondary text                          |
| `--accent`             | 32 90% 55%  | #E88A2D | Warm orange (discount tags, highlights) |
| `--border`             | 40 15% 88%  | #E2DED8 | Warm borders                            |
| `--destructive`        | 0 72% 51%   | #D93636 | Error/danger                            |
| `--card`               | 40 30% 99%  | #FEFDFB | Card backgrounds                        |
| `--discount-orange`    | 32 100% 50% | #FF8C00 | Discount badges                         |

#### Dark Mode

| Token          | HSL         | Hex     | Usage                     |
|----------------|-------------|---------|---------------------------|
| `--background` | 150 15% 8%  | #111D14 | Deep forest dark          |
| `--foreground` | 40 20% 95%  | #F5F2EE | Warm white text           |
| `--primary`    | 145 55% 42% | #36A84E | Lighter green for dark bg |
| `--card`       | 150 12% 12% | #1A251C | Dark forest cards         |
| `--muted`      | 150 10% 16% | #232E25 | Muted dark surfaces       |
| `--border`     | 150 10% 18% | #283029 | Subtle dark borders       |

### Spacing & Radius

| Token      | Value                | Usage                 |
|------------|----------------------|-----------------------|
| `--radius` | 1rem (16px)          | Default border-radius |
| Cards      | `rounded-2xl` (16px) | All card components   |
| Inputs     | `rounded-xl` (12px)  | Form inputs, search   |
| Buttons    | `rounded-xl` (12px)  | Action buttons        |
| Header     | `rounded-2xl` (16px) | Floating header pill  |

### Shadows

| Context      | Value                               |
|--------------|-------------------------------------|
| Card default | `0 4px 20px rgba(30, 60, 30, 0.06)` |
| Card hover   | `0 8px 30px rgba(30, 60, 30, 0.1)`  |
| Header       | `0 4px 24px rgba(30, 60, 30, 0.08)` |

All shadows use green-tinted rgba for organic feel (not gray).

### Components

#### Header

- **Floating glass morphism**: `sticky top-0`, `mx-4 mt-3`, `rounded-2xl`
- **Backdrop blur**: `backdrop-blur-md bg-white/80` (90% on scroll)
- **Logo**: Leaf icon (Lucide) + "FoodWise" in Lora font
- **Actions**: Search (expandable), Cart (with badge), Profile
- **Scroll-aware**: opacity increases past 20px scroll

#### Login Page

- **Split layout** (desktop): left decorative panel + right form
- **Left panel**: Forest green gradient (`from-green-800 via-emerald-700 to-green-900`), organic blob SVGs, eco-stats (
  10,000+ saved portions, 500+ partners, 2,000 kg saved)
- **Right panel**: Form card with organic inputs (`rounded-xl`), `p-6 sm:p-8`
- **Full-screen**: `fixed inset-0 z-[60]`, `h-[100dvh]`, `overflow-hidden`
- **Own header**: Integrated transparent header matching main layout
- **Hides layout header** on mount via useEffect

#### Empty States

- Animated floating leaf icon (Framer Motion, infinite bob: `y: [0, -8, 0]`)
- Lora font heading
- Rounded card with subtle border
- Fade-in entrance animation

#### Hero Carousel

- `rounded-2xl overflow-hidden`
- Horizontal gradient overlay: `bg-gradient-to-r from-black/50 to-transparent`
- Lora font for headline

### Animations (Framer Motion)

| Pattern                                                 | Usage                             |
|---------------------------------------------------------|-----------------------------------|
| `fadeUp`: `{opacity: 0, y: 20}` -> `{opacity: 1, y: 0}` | Staggered form elements, sections |
| `whileInView` + `viewport: {once: true}`                | Section headings on scroll        |
| Infinite bob: `y: [0, -8, 0]` over 3s                   | Empty state icons                 |
| `whileHover: {rotate: [0, -12, 12, -6, 0]}`             | Logo leaf icon                    |
| `AnimatePresence` + width animation                     | Search input expand/collapse      |
| Spring scale badge                                      | Cart count badge                  |

### Transitions

```css
a, button, input, select, textarea, [role="button"], .card, .btn {
    transition-property: color, background-color, border-color, box-shadow, transform, opacity;
    transition-duration: 200ms;
    transition-timing-function: ease;
}
```

### Accessibility

- WCAG AA color contrast (4.5:1 minimum for text)
- `cursor-pointer` on all clickable elements
- Visible focus rings (`focus:ring-primary`)
- `font-display: swap` for web fonts
- `prefers-reduced-motion` respected (Framer Motion)
- Touch targets >= 44x44px

### Icons

- **Library**: Lucide React (consistent 24x24 viewBox)
- **Brand icon**: `Leaf` from Lucide
- **No emojis** as UI icons

### Dark Mode

- Toggled via `next-themes` (`ThemeProvider` with `attribute="class"`)
- `.dark` class on `<html>`
- All colors defined as CSS variables with light/dark variants

---

## Environment Variables

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=   # Google Maps
API_BASE_URL=http://localhost:8080  # Backend API
GOOGLE_GENAI_API_KEY=               # Google Genkit AI
GCP_CREDENTIALS_JSON=               # GCP auth
GCP_STORAGE_BUCKET=                 # Cloud Storage bucket
```

---

## Development

```bash
npm run dev        # Dev server (Turbopack, port 9002)
npm run build      # Production build
npm run lint       # ESLint (eslint src/)
npm run typecheck  # TypeScript (tsc --noEmit)
```

## Deployment

Docker + GitHub Actions -> Google Cloud Run. Dockerfile in repo root.
