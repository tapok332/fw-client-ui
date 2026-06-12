# FoodWise Design System

> *Rescue food. Save money. Save the planet.*
> A food-rescue marketplace where people buy "surprise boxes" of unsold-but-good food
> from local bakeries, restaurants and grocery stores at 30–70% off.

This document is the **brand + UI design system** for the FoodWise mobile-web app
(Ukrainian-first, English secondary). It documents the look, the voice, the
component vocabulary, and provides ready-to-use HTML snippets you can drop into
mocks, decks or production work.

---

## Sources

The system is extracted directly from the live codebase — the code is the single
source of truth:

- `src/app/globals.css` — design tokens (HSL CSS variables)
- `tailwind.config.ts` — Tailwind color/font wiring
- `src/components/ui/*` — shadcn/ui primitives (button, card, badge, input…)
- `src/components/{home,store,cart,header}/*` — product components
- `src/lib/translations.ts` — uk + en copy (the voice lives here)
- `PRODUCT.md` — brand brief

Brand references: Too Good To Go, Bolt Food, Glovo (general patterns only —
no copying).

---

## Product context

FoodWise is **one product** with two audiences:

| Surface          | Who                          | Notes                                          |
| ---------------- | ---------------------------- | ---------------------------------------------- |
| **Consumer PWA** | Budget + eco-aware, 20–35 yo | Mobile-first, Kyiv-centric, UAH, uk default.   |
| Merchant tools   | Restaurants, cafes, stores   | Out of scope for this design system iteration. |

Viewing context for the consumer app: **outdoor / transit / quick glances**.
Light mode is the correct default; dark mode for evening browsing. Decisions are
impulsive and time-sensitive — large tap targets, one-tap add-to-cart, minimal
checkout.

Core flows: **discover** (home + categories + map) → **browse store / box** →
**add to cart** → **checkout (pickup window)** → **show pickup code**.

---

## Brand personality

Three words: **earthy, generous, honest.**

> Not "modern". This brand feels like a local farmer's market stall, not a tech
> startup. Warm but not saccharine. Practical but not utilitarian. The interface
> should feel like picking food from a basket — not browsing a catalog.

Emotional goals: *feel-good about helping the planet, excitement of a deal,
trust in freshness.*

Anti-references — things to avoid:

- Generic SaaS dashboards (cold blue, gray cards, dense tables)
- Glassmorphism for decoration
- Corporate enterprise UI (sharp corners, info density)
- Cyan-on-dark "AI aesthetic"
- Bluish-purple gradients, emoji-decorated cards, rounded-corner-with-coloured-left-border cards

---

## CONTENT FUNDAMENTALS

### Voice — warm, honest, eco-conscious, a little playful

The product is bilingual. Voice rules apply to **both languages**; tone and
casing differ slightly per language norms.

- **Person**: **second person, informal** ("you / ти / ви"). Ukrainian uses
  the informal `ти`-form for in-app actions (`Увійти`, `Спробуйте ще раз`).
- **Mood**: declarative + action-oriented. Verbs lead.
- **Sentence length**: short. One idea per line. Mobile copy is glance-able.
- **Casing**: **Sentence case for UI**. Headings *do not* use title case in
  Ukrainian. English headings are sentence case too (`Featured Stores`,
  `Save food, save money` — note the lowercase second clause).
- **No emoji** in product UI. The brand voice is sincere, not chirpy. Iconography
  carries the visual warmth instead.
- **No exclamation marks** in default copy. Exception: the brand promise
  (`Save food, save money, save the planet`) and rare success states.
- **Numbers as numerals**: `-40%`, `30 хв`, `120 ₴`. Ukrainian uses ₴ (UAH);
  EN may use ₴ or `UAH` depending on context.
- **Pluralization**: Ukrainian has three forms (1 / 2-4 / many) — see
  `getItemNoun()` in `cart/page.tsx`. Honor it.

### Specific copy examples (from the live app)

| Where               | Ukrainian (source of truth)            | English                              |
| ------------------- | -------------------------------------- | ------------------------------------ |
| Brand slogan        | *Рятуйте їжу, економте гроші*          | *Save food, save money*              |
| Hero pillars        | *Рятуйте їжу · Економте гроші · Рятуйте планету* | *Save Food · Save Money · Save Planet* |
| Primary CTA         | *Переглянути заклади*                  | *Explore Stores*                     |
| Add-to-cart toast   | *Додано до кошика*                     | *Added to cart*                      |
| Error fallback      | *Не вдалося додати — спробуйте ще раз* | *Couldn't add — try again*           |
| Onboarding step 1   | *Обирайте — Знаходьте сюрприз-бокси поблизу зі знижкою 30-70%* | *Choose — Find surprise boxes nearby with 30-70% discount* |
| Empty state (cart)  | *Кошик порожній*                       | *Your cart is empty*                 |
| Section header      | *Заклади поблизу*                      | *Stores Nearby*                      |

### Words to favour / avoid

- **Favour**: rescue, save, nearby, fresh, surprise, today, pickup, neighbourhood,
  baker, store. Verbs of generosity (`give`, `share`, `pick up`).
- **Avoid**: discount-shopping language (`deal`, `bargain`, `cheap`), corporate
  language (`solution`, `platform`, `seamless`), tech-startup language
  (`AI-powered`, `experience`).
- **Mission framing > price framing.** Always lead with what the user accomplishes
  ("Save food") rather than what they get ("70% off"). The discount is the proof,
  not the pitch.

---

## VISUAL FOUNDATIONS

> Quick reference. See `colors_and_type.css` for the full token set.

### Palette

Built on **HSL CSS variables**. Light mode is the canonical theme; dark mode is
fully supported and uses **deep forest tones, never gray.**

| Role           | Light                       | Dark                |
| -------------- | --------------------------- | ------------------- |
| Background     | Warm cream `#FBF9F6`        | Deep forest `≈#111B14` |
| Foreground     | Dark forest `≈#1F2E21`      | Warm white          |
| Primary        | Forest green `#1E7A3A` (AAA on cream) | Lifted green `≈#3FA663` |
| Accent         | Warm orange `#E88A2D`       | Same orange         |
| Muted          | Warm beige `≈#EDEAE4`       | Forest stone        |
| Border         | Warm beige `≈#E3DED4`       | Forest dim          |
| Discount badge | Orange (accent) on white    | Orange on white     |

**No pure black, no pure white.** Pure white is too clinical; the cream
background is the canvas every interface sits on.

### Typography

- **Headings**: *Vollkorn* — serif, generous letterforms, Cyrillic-complete.
  Weight 600 default; 700 for display. Tight line-height (`1.1`), snug tracking.
- **Body**: *Rubik* — sans, friendly geometric, Cyrillic-complete. Weight 400 body,
  500 emphasis, 600 button. Relaxed line-height (`1.65`).
- **Numerals**: tabular figures (`font-variant-numeric: tabular-nums`) for any
  price, time, distance, or quantity.
- No mono font is used in product UI. (We define one in tokens for code blocks
  in docs only.)

### Shape & motion

- **Radius**: `--radius: 16px` is the base. Cards land at `rounded-2xl` (16-24px).
  Buttons at `rounded-md` (≈12px). Inputs at `rounded-md`. Chips, badges, FAB,
  cart-count: pill (`9999px`).
- **Motion**: **200ms** is the default transition duration. Easing is
  `cubic-bezier(0.23, 1, 0.32, 1)` ("biophilic ease" — slow finish). Decorative
  elements are *ease-out only* — never spring/bounce. Honor
  `prefers-reduced-motion`.
- **Hover state**: cards lift `translateY(-4px)` + deepen shadow.
  Buttons darken `bg-primary/90`. Icon buttons add `bg-primary/10` tint.
- **Press state**: `active:scale-[0.98]` on cards, `whileTap: scale(0.85)` on
  icon buttons (Framer Motion). Subtle, never bouncy.
- **Focus**: visible ring (`focus-visible:ring-2 ring-primary`). Always.

### Shadows

Layered, **green-tinted** (`hsl(140 35% 18% / 0.04)`), never gray. Three sizes:
`--shadow-soft`, `--shadow-soft-md` (default for cards), `--shadow-soft-lg`
(hover). A specific `--shadow-cta` gives the primary button a green-tinted
green halo. Bottom nav uses a top-shadow (`--shadow-nav-top`) instead of a
border.

### Backgrounds & decoration

- **Background**: solid cream `#FBF9F6` everywhere. No textures, no gradients,
  no patterns. The warmth comes from the colour itself.
- **Subtle leaf-shape decorations** (very low opacity, ~3%) are placed
  off-screen in corners on the home and login pages. See `src/app/page.tsx` —
  large rounded-blob SVGs absolutely positioned, `pointer-events-none`,
  `opacity-[0.03]`. They're decoration, not iconography.
- **Hero images** are full-bleed photographs of food, with a top-to-bottom
  `black/60 → black/20` gradient so white headline text stays legible.
- **No glassmorphism, no neumorphism, no big gradients.** The header uses
  `backdrop-blur-md` against `bg-background/80` for a *subtle* frost when
  scrolled — that's the only blur in the app.

### Layout

- **Mobile-first.** All components designed for ~390px first, scaled up.
- **Generous spacing** — sections breathe at `py-6 px-4`. Cards have ~`p-4`
  internal padding (text) + a clean image edge (no padding on image).
- **Fixed elements**: floating glass header (top, all viewports), bottom tab
  nav (mobile only, hidden on checkout flow).
- **Touch targets**: minimum 44×44px. Bottom nav icons sit in 40px tap squares;
  primary CTA buttons are `h-11 lg` (44px+).
- **Scrollbars are hidden** across the app (`scrollbar-width: none`,
  `::-webkit-scrollbar { display: none }`) — scroll behavior is preserved.
- **Horizontal scroll snap** is used heavily for card carousels
  (`overflow-x-auto + scroll-snap-type-x mandatory`).

### Imagery

Warm, naturally-lit, **food in context** — never studio-isolated. Hands, baskets,
counter tops, baker aprons. Avoid: glossy stock, cold lighting, overhead minimalist
flat-lays. Slight golden cast preferred. No filters / B&W / heavy grain.

### Cards

The canonical FoodWise card (`StoreCard`, `SurpriseBoxCard`):

- `w-64 flex-shrink-0` (fixed width inside scroll carousel)
- `rounded-3xl` (24px), `bg-card`, `shadow-soft-md` → `shadow-soft-lg` on hover
- Image (`h-36`–`h-40` `object-cover`) bleeds to edges
- Floating overlay chips on image (rating top-right, discount top-left, FAB
  add-to-cart bottom-right)
- `p-4` content area, title (semibold, truncate), then meta row of icons
  + small text (`Clock`, `MapPin`, etc.)
- Hover: lifts `-translate-y-1`, active: `scale-[0.98]`

### Transparency / blur

Used sparingly:
- Sticky header: `bg-background/80 backdrop-blur-md`
- Mobile nav: `bg-white/90 backdrop-blur-md`
- Floating chips on imagery: `bg-white/90 backdrop-blur-sm`

Never used as decoration for its own sake.

---

## ICONOGRAPHY

- **Library**: **Lucide React** (`lucide-react@^0.475.0`) — the only icon set
  in production. Stroke icons, ~`size-4` / `size-5` in UI, default stroke
  width.
- **Brand icon**: `Leaf` — appears in the wordmark, in empty states, and as the
  default category fallback.
- **No emoji** anywhere in product UI.
- **No custom SVG icons** beyond a single map-pin.
- **Unicode characters used as glyphs**: `₴` for UAH currency. That's it.

---

## Caveats / things to know

- **Fonts**: this system imports **Vollkorn** (headings) and **Rubik** (body)
  from Google Fonts with Cyrillic + Latin subsets. The codebase uses the same
  pair via `next/font/google`. No local font files needed.
- **There is no Figma source of truth** — tokens live in the CSS variables
  and Tailwind config, components in the source `.tsx` files. Change the code,
  and the system changes with it.
- **No merchant-facing UI** exists yet — the codebase is consumer-only.
