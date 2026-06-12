## Design Context

### Users
Budget-conscious, eco-aware consumers in Kyiv, Ukraine (ages 20-35). They browse on mobile phones (PWA, mobile-first) during lunch breaks or evenings, looking for nearby surprise boxes of unsold food from restaurants and stores at 30-70% discount. They're in a hurry — decisions are impulsive, time-sensitive.

Secondary: merchants (restaurants, cafes, stores) reducing unsold inventory.

**Viewing context:** Outdoor/transit (bright light), quick glances between tasks. Light mode is the correct default. Dark mode for evening browsing.

### Brand Personality
Three words: **earthy, generous, honest**.

Not "modern" — this brand feels like a local farmer's market stall, not a tech startup. Warm but not saccharine. Practical but not utilitarian. The interface should feel like picking food from a basket, not browsing a catalog.

Emotional goals: feel-good about helping the planet, excitement of a deal, trust in freshness.

### Aesthetic Direction
**Organic Biophilic** — nature-inspired, rounded, warm. NOT clinical, NOT corporate, NOT cold.

- **Primary:** Forest green `#1E7A3A` — CTAs, links, accents
- **Accent:** Warm orange `#E88A2D` — discount badges, highlights
- **Background:** Warm cream `#FBF9F6` — not pure white
- **Shadows:** Green-tinted `rgba(30, 60, 30, 0.06)` — not gray
- **Radius:** 16px base (rounded-2xl cards, rounded-xl buttons/inputs)
- **Icons:** Lucide React. Brand icon: Leaf
- **Theme:** Light primary, dark mode uses deep forest greens (not grays)

**Typography:** Needs distinctive serif + sans pair with cyrillic support. Current Lora + Raleway flagged as reflex/overused — replacement needed. Look for fonts that feel handmade/organic, not corporate.

**References:**
- Too Good To Go — primary competitor, food rescue mobile UX
- Bolt Food / Glovo — delivery app UX patterns, mobile navigation, cart flow

**Anti-references:**
- Generic SaaS dashboards (cold blue, gray cards)
- Glassmorphism-heavy designs (decorative blur everywhere)
- Corporate enterprise UIs (sharp corners, dense tables)
- Cyan-on-dark AI aesthetic

### Design Principles
1. **Earthy warmth** — Every surface should feel natural, not digital. Cream backgrounds, green-tinted shadows, organic shapes. No pure black or pure white.
2. **Mobile-first impulse** — PWA context. Touch targets >= 44px, one-tap add-to-cart, minimal checkout steps. Users decide in seconds.
3. **Eco-storytelling** — Every interaction reinforces the mission. Show CO2 saved, meals rescued, money saved. Make the user feel they're making a difference.
4. **Frictionless discovery** — Surprise boxes are time-sensitive. Fast browsing, horizontal scrolling, visual-first cards. No walls of text.
5. **Ukrainian-first** — UI defaults to Ukrainian, currency in UAH, Kyiv-centric geo (50.4501N, 30.5234E).

### Accessibility
- **Target:** WCAG AAA (7:1 contrast ratio for text, 4.5:1 for large text)
- **Keyboard:** Full keyboard navigation, visible focus indicators
- **Screen readers:** aria-labels on all interactive elements, proper heading hierarchy
- **Motion:** Respect prefers-reduced-motion
- **Touch:** Minimum 44x44px targets
- **Color:** Not the sole indicator of state

### Technical Constraints
- Next.js 15 (App Router), React 18, TypeScript
- Tailwind CSS with HSL CSS variable color system
- Framer Motion for animations (ease-out only, no spring/bounce on decorative elements)
- Radix UI primitives + shadcn/ui wrappers
- Google Fonts with cyrillic subsets required
