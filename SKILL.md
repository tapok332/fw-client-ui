---
name: foodwise-design
description: Use this skill to generate well-branded interfaces and assets for FoodWise, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping. FoodWise is a Ukrainian-first food-rescue marketplace (surprise boxes of unsold food at 30-70% off). The aesthetic is "Organic Biophilic" — warm cream, forest green, earthy orange, generous spacing, soft green-tinted shadows. Voice is warm, honest, eco-conscious, never corporate. No emoji.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

Key files:
- `README.md` — full brand, content, and visual foundations.
- `colors_and_type.css` — drop-in CSS tokens (colors, type, shadows, radii, motion).
- `assets/` — logos, icons, payment marks, placeholder photos.
- `ui_kits/foodwise_pwa/` — pixel-close React component recreations + a full
  click-thru prototype (`index.html`) showing how everything composes.
- `preview/` — small per-concept specimens shown in the Design System tab.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets
out and create static HTML files for the user to view. Import
`colors_and_type.css`, pull the `Vollkorn` + `Rubik` Google Fonts (Cyrillic +
Latin subsets), and lean on the `ui_kits/foodwise_pwa/*.jsx` components rather
than rebuilding from scratch.

If working on production code, you can copy assets and read the rules here to
become an expert in designing with this brand. The live tokens shipped to
production are the same ones in `colors_and_type.css`.

If the user invokes this skill without any other guidance, ask them what they
want to build or design, ask some questions, and act as an expert designer who
outputs HTML artifacts *or* production code, depending on the need.

### Non-negotiables (worth restating before you start)

- **Cream not white**, **forest green not blue**, **warm orange for emphasis** —
  never invent new hues.
- **Vollkorn for headings, Rubik for body.** Tabular numerals for any price /
  time / distance.
- **16px radius** base, cards `rounded-2xl`/`rounded-3xl`, pills for badges and
  chips.
- **Soft green-tinted shadows**, never gray.
- **200 ms** transitions, `cubic-bezier(0.23, 1, 0.32, 1)`, no spring/bounce.
- **No emoji** in product UI. **Lucide** for icons.
- **Mobile-first**, ≥44px tap targets, scrollbars hidden but scroll preserved.
- **Voice**: second person, informal, sentence case, mission-first
  ("Save food" > "70% off"). Bilingual uk/en — Ukrainian is primary.
