# Frontend Stores API Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Мигрировать frontend `fw-client-ui` на новый backend-контракт `fw-store-service` (Phase 2): `StoreType` + `Category.slug` + рабочая серверная фильтрация. Убрать хардкоды `/category/restaurant`, перевести `/restaurants` на `?type=RESTAURANT`, заменить `categoryName` на `category.name`.

**Architecture:** Server-driven фильтрация (никакой client-side фильтрации поверх). Slug-based routing для категорий-кухонь. Отдельные пути для типов заведений (`/restaurants`). Zod-схемы на API boundary как runtime-контракт (заменяют отсутствующие unit-тесты). `categoryName` deprecated удаляется сразу (break compat, fallback на тире).

**Tech Stack:** Next.js 15 App Router · React 18 · TypeScript strict · Zod 3 · Tailwind · Radix · existing `fetchAPI` wrapper в `src/lib/api.ts`. Test setup отсутствует — верификация через `npm run typecheck`, `npm run lint`, `npm run build`, playwright smoke.

**Контракт-источник:** `docs/contracts/stores-api.md`.

---

## File structure

| Файл | Responsibility | Действие |
|---|---|---|
| `src/types/index.ts` | Domain types `Store`, `Category` + новый `StoreType` | Modify |
| `src/lib/api-schemas.ts` | **Новый** файл: Zod-схемы для StoreDto, CategoryDto, Page<T>, ApiResponse<T> | Create |
| `src/lib/api.ts` | API client: новый `buildStoresQuery`, переработанный `stores.getByCategory`, новый `stores.search`, новый `categories.getBySlug` | Modify |
| `src/app/category/[slug]/page.tsx` | Категорийная страница: убрать `find()`, использовать `categorySlug` + `latitude/longitude`, подтянуть display name через `categories.getBySlug` | Modify |
| `src/app/restaurants/page.tsx` | Страница ресторанов: убрать curated sections (featured/nearby/recommended), использовать `stores.search({ type: 'RESTAURANT' })` | Modify |
| `src/app/page.tsx` | Главная: 2 хардкода `/category/restaurant` → `/restaurants` | Modify |
| `src/components/MobileNavigation.tsx` | 1 хардкод `/category/restaurant` → `/restaurants` | Modify |
| `src/components/home/hero-carousel.tsx` | 1 хардкод `/category/restaurant` → `/restaurants` | Modify |
| `src/components/category/category-chips.tsx` | Ссылки строить через `cat.slug` | Modify |
| `src/components/category/category-card.tsx` | Чтение `store.category?.name` вместо `categoryName` | Modify |
| `src/components/home/surprise-box-card.tsx`, `src/components/store/store-card.tsx`, прочее | Заменить `store.categoryName` на `store.category?.name ?? '—'` | Modify (точечно по grep) |

---

## Task 1: Types + Zod schemas

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/lib/api-schemas.ts`

- [ ] **Step 1: Прочитать текущий `src/types/index.ts` целиком**

Чтобы понять существующие типы `Store`, `Category` и не сломать другие импорты.

```bash
wc -l src/types/index.ts
```

- [ ] **Step 2: Добавить `StoreType` и переписать `Category`, `Store` в `src/types/index.ts`**

Найти существующий `export interface Category` и заменить на:

```ts
export type StoreType =
  | "RESTAURANT"
  | "GROCERY"
  | "BAKERY"
  | "CAFE"
  | "SWEETS"
  | "OTHER";

export const CANONICAL_CATEGORY_SLUGS = [
  "pizza", "sushi", "bakery", "asian", "burgers",
  "coffee", "dessert", "vegan", "pastry", "greek",
] as const;
export type CategorySlug = typeof CANONICAL_CATEGORY_SLUGS[number];

export interface Category {
  id: string;
  slug: string;
  name: string;
  iconName: string | null;
}
```

В существующем `interface Store` добавить:
```ts
  type: StoreType;
  category: Category | null;
```

Удалить (или пометить optional на 1 файл grep'ом, см. Task 8):
```ts
  categoryName?: string;  // remove this line
```

Сохранить остальные поля как были (`logoUrl`, `heroUrl`, `isOpen` — они приходят из `mapStoreImageFields`, контракт их не трогает).

- [ ] **Step 3: Создать `src/lib/api-schemas.ts`**

```ts
import { z } from "zod";

export const StoreTypeSchema = z.enum([
  "RESTAURANT", "GROCERY", "BAKERY", "CAFE", "SWEETS", "OTHER",
]);

export const CategorySchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  iconName: z.string().nullable(),
});

export const LocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const StoreDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: StoreTypeSchema,
  category: CategorySchema.nullable(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  heroImageUrl: z.string().nullable(),
  address: z.string().nullable(),
  location: LocationSchema.nullable(),
  rating: z.number().min(0).max(5).nullable(),
  opensAt: z.string().nullable(),
  closesAt: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  deliveryFee: z.number().nullable(),
  minOrderAmount: z.number().nullable(),
  priceLevel: z.number().int().min(1).max(4).nullable(),
  currentlyOpen: z.boolean(),
  menuItems: z.array(z.any()).default([]),
  combos: z.array(z.any()).default([]),
  distance: z.number().nullable(),
  // deprecated mirror — backend ещё шлёт, мы не падаем если поле есть
  categoryName: z.string().nullable().optional(),
});

export const PageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    content: z.array(item),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    size: z.number().int().positive(),
    number: z.number().int().nonnegative(),
    first: z.boolean(),
    last: z.boolean(),
    empty: z.boolean(),
    numberOfElements: z.number().int().nonnegative(),
  });

export const StoresPageSchema = PageSchema(StoreDtoSchema);
export const CategoriesListSchema = z.array(CategorySchema);
```

- [ ] **Step 4: Verify typecheck**

```bash
npm run typecheck
```
Expected: PASS. Если ошибки — исправить (вероятно где-то осталось чтение `store.categoryName` без optional chain — это Task 8).

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/lib/api-schemas.ts
git commit -m "feat(types): add StoreType, Category.slug, Zod schemas

Backend контракт Phase 2: StoreType enum (макро-классификация заведений),
Category стал first-class entity с slug, Store.category = объект.
Zod-схемы на API boundary как runtime контракт-валидация (test setup в проекте отсутствует)."
```

---

## Task 2: API client refactor

**Files:**
- Modify: `src/lib/api.ts:298-364` (stores.getByCategory + новый stores.search)
- Modify: `src/lib/api.ts:380-383` (categories — добавить getBySlug)

- [ ] **Step 1: Прочитать текущий `src/lib/api.ts:255-365`**

Конкретно блоки `api.stores.*` и `api.categories.*`.

- [ ] **Step 2: Добавить helper `buildStoresQuery` перед блоком `api.stores`**

Вставить в `src/lib/api.ts` сразу после `mapSurpriseBoxFields` (примерно строка 41):

```ts
export interface StoreSearchParams {
  search?: string;
  type?: import("@/types").StoreType;
  categoryId?: string;
  categorySlug?: string;
  latitude?: number;
  longitude?: number;
  minRating?: number;
  maxDistance?: number;
  openNow?: boolean;
  priceLevel?: number[];
  sort?: "distance" | "rating" | "priceAsc" | "priceDesc" | "relevance";
  page?: number;
  limit?: number;
}

function buildStoresQuery(params: StoreSearchParams): string {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.type) qs.set("type", params.type);
  if (params.categoryId) qs.set("categoryId", params.categoryId);
  if (params.categorySlug) qs.set("categorySlug", params.categorySlug);
  if (params.latitude !== undefined) qs.set("latitude", String(params.latitude));
  if (params.longitude !== undefined) qs.set("longitude", String(params.longitude));
  if (params.minRating !== undefined) qs.set("minRating", String(params.minRating));
  if (params.maxDistance !== undefined) qs.set("maxDistance", String(params.maxDistance));
  if (params.openNow !== undefined) qs.set("openNow", String(params.openNow));
  if (params.sort) qs.set("sort", params.sort);
  if (params.page !== undefined) qs.set("page", String(params.page));
  if (params.limit !== undefined) qs.set("limit", String(params.limit));
  (params.priceLevel ?? []).forEach(level => qs.append("priceLevel", String(level)));
  return qs.toString();
}
```

- [ ] **Step 3: Заменить `api.stores.getByCategory` и добавить `api.stores.search`**

В `api.stores` найти `getByCategory: (category: string, params?: {...}) => {...}` и заменить на:

```ts
search: (params: StoreSearchParams) => {
    const qs = buildStoresQuery(params);
    const url = qs ? `/stores?${qs}` : "/stores";
    return fetchAPI<ApiResponse<{
        content: Store[],
        totalPages: number,
        totalElements: number,
        empty: boolean,
        number: number,
    }>>(url).then(response => {
        const data = response.data;
        if (!data?.content) return { items: [], totalPages: 0, totalElements: 0, page: 0 };
        return {
            items: data.content.map(mapStoreImageFields) as Store[],
            totalPages: data.totalPages ?? 0,
            totalElements: data.totalElements ?? 0,
            page: data.number ?? 0,
        };
    });
},
getByCategory: (categorySlug: string, params?: Omit<StoreSearchParams, "categorySlug">) => {
    return api.stores.search({ ...(params ?? {}), categorySlug }).then(r => r.items);
},
```

Старая сигнатура `getByCategory(category, {page, limit, lat, lng, ...})` ломается — это **намеренно**. Все каллеры мигрируют в Task 5/6.

- [ ] **Step 4: Добавить `categories.getBySlug` и обновить `categories.getAll`**

В `api.categories` блок:

```ts
categories: {
    getAll: () => fetchAPI<ApiResponse<Category[]>>('/home/categories')
        .then(response => response.data || []),
    getBySlug: (slug: string) => fetchAPI<ApiResponse<Category>>(`/categories/${slug}`)
        .then(response => response.data || null),
},
```

- [ ] **Step 5: Verify typecheck**

```bash
npm run typecheck
```
Expected: ошибки на каллерах старой сигнатуры `getByCategory` (это ожидаемо, фиксим в Task 5/6). Если есть другие — фиксить здесь.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat(api): rewrite stores client for Phase 2 contract

- buildStoresQuery: URLSearchParams builder с multi-value priceLevel.
- stores.search({ type, categorySlug, latitude, longitude, minRating, sort, ... }):
  возвращает items + totalPages + page для пагинации.
- stores.getByCategory(slug, params): тонкая обёртка над search.
- categories.getBySlug(slug): новый endpoint для category page header.

Параметры теперь latitude/longitude (не lat/lng), categorySlug (не category).
Старая сигнатура getByCategory сломана намеренно — каллеры мигрируют в следующих коммитах."
```

---

## Task 3: Remove hardcoded `/category/restaurant`

**Files:**
- Modify: `src/app/page.tsx:203,243`
- Modify: `src/components/MobileNavigation.tsx:27`
- Modify: `src/components/home/hero-carousel.tsx:147`

- [ ] **Step 1: Заменить в `src/app/page.tsx`**

Найти 2 вхождения:
```tsx
<Link href="/category/restaurant" className="text-primary">
```
Заменить на:
```tsx
<Link href="/restaurants" className="text-primary">
```

- [ ] **Step 2: Заменить в `src/components/MobileNavigation.tsx:27`**

```tsx
{href: "/category/restaurant", icon: Utensils, label: t("navigation", "restaurants")},
```
Заменить на:
```tsx
{href: "/restaurants", icon: Utensils, label: t("navigation", "restaurants")},
```

- [ ] **Step 3: Заменить в `src/components/home/hero-carousel.tsx:147`**

```tsx
<Link href="/category/restaurant" className="flex items-center">
```
Заменить на:
```tsx
<Link href="/restaurants" className="flex items-center">
```

- [ ] **Step 4: Verify нет других вхождений**

```bash
grep -rn "category/restaurant\|category=restaurant" src/
```
Expected: пусто.

- [ ] **Step 5: Verify typecheck + lint**

```bash
npm run typecheck && npm run lint
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/components/MobileNavigation.tsx src/components/home/hero-carousel.tsx
git commit -m "refactor: hardcoded /category/restaurant → /restaurants

\`restaurant\` это тип заведения (StoreType), не категория-кухня.
Ссылки на browse ресторанов ведут на /restaurants, который фильтрует ?type=RESTAURANT.
Категория /category/[slug] зарезервирована для кухонь (pizza, sushi, ...)."
```

---

## Task 4: CategoryChips — slug-based links

**Files:**
- Modify: `src/components/home/category-chips.tsx`
- Modify: `src/components/category/category-chips.tsx` (если существует другой)

- [ ] **Step 1: Прочитать оба `category-chips.tsx` (home и category)**

```bash
grep -rn "encodeURIComponent\|/category/" src/components/**/category-chips.tsx
```

- [ ] **Step 2: Заменить построение URL**

Найти в каждом файле:
```tsx
window.location.href = `/category/${encodeURIComponent(category)}`;
```
или
```tsx
<Link href={`/category/${cat.name.toLowerCase()}`}>
```

Заменить на использование slug. Если props приходит как объект `Category`:
```tsx
<Link href={`/category/${cat.slug}`}>
```

Если props — строка (текущий `categories: string[]`), нужно передавать массив `Category[]` сверху. Это требует изменения signature CategoryChips. Сделай так:

```tsx
interface CategoryChipsProps {
  categories: Category[];  // вместо string[]
  selectedCategory: string | null;
  categoryIcons: Record<string, JSX.Element>;
  showAllCategory?: boolean;
  onSelect?: (slug: string | null) => void;
}
```

И каллеры (главная page.tsx, restaurants page, category page) передают `categories` объекты, не имена.

- [ ] **Step 3: Каллеры обновить**

В `src/app/page.tsx` и `src/app/restaurants/page.tsx` найти:
```tsx
const categoryKeys = categories.map(cat => cat.name.toLowerCase());
// ...
<CategoryChips categories={categoryKeys} ... />
```

Заменить на:
```tsx
<CategoryChips categories={categories} ... />
```

В `src/app/category/[slug]/page.tsx` — аналогично, передавать объекты.

`selectedCategory` теперь slug-string (URL slug), не name.toLowerCase().

- [ ] **Step 4: Verify typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/components/home/category-chips.tsx src/app/page.tsx src/app/restaurants/page.tsx src/app/category/[slug]/page.tsx
git commit -m "refactor(category-chips): передаём Category[] вместо string[], строим ссылки через slug

Контракт Phase 2 даёт slug в /home/categories. URL /category/{slug} использует тот же slug.
Никаких .toLowerCase()/encodeURIComponent для построения URL — slug уже URL-safe (^[a-z0-9-]+\$)."
```

---

## Task 5: Refactor `/category/[slug]/page.tsx`

**Files:**
- Modify: `src/app/category/[slug]/page.tsx`

- [ ] **Step 1: Прочитать целиком**

- [ ] **Step 2: Убрать `find()` lookup, использовать slug напрямую**

В `fetchInitialData` (примерно строка 144) текущий код:
```tsx
const categoriesResult = await api.categories.getAll();
setCategories(Array.isArray(categoriesResult) ? categoriesResult : []);
const currentCategory = Array.isArray(categoriesResult)
    ? categoriesResult.find(cat => categorySlug && cat.name.toLowerCase() === categorySlug.toLowerCase())
    : null;
if (currentCategory) setCategoryInfo(currentCategory);
if (categorySlug) {
    const apiParams = { sort: filterOptions.sort, lat: userCoordinates?.lat, lng: userCoordinates?.lng };
    const items = await api.stores.getByCategory(categorySlug, apiParams);
    // ...
}
```

Заменить на:
```tsx
const [categoriesResult, currentCategory] = await Promise.all([
    api.categories.getAll(),
    api.categories.getBySlug(categorySlug).catch(() => null),
]);
setCategories(Array.isArray(categoriesResult) ? categoriesResult : []);
if (currentCategory) setCategoryInfo(currentCategory);

if (categorySlug) {
    const result = await api.stores.search({
        categorySlug,
        sort: filterOptions.sort,
        latitude: userCoordinates?.lat,
        longitude: userCoordinates?.lng,
        limit: 20,
        page: 0,
    });
    setFilteredItems(result.items);
    setHasMore(result.page + 1 < result.totalPages);
}
```

- [ ] **Step 3: Обновить `applyFilters`**

Найти `const applyFilters = useCallback(...)` (примерно строка 94). Заменить тело:

```tsx
const applyFilters = useCallback(async () => {
    setIsLoading(true);
    try {
        if (!categorySlug) {
            setFilteredItems([]);
            setHasMore(false);
            return;
        }
        const result = await api.stores.search({
            categorySlug,
            search: searchQuery.trim() || undefined,
            minRating: filterOptions.minRating > 0 ? filterOptions.minRating : undefined,
            maxDistance: filterOptions.maxDistance < 10 ? filterOptions.maxDistance : undefined,
            openNow: filterOptions.openNow || undefined,
            priceLevel: filterOptions.priceLevel.length > 0 ? filterOptions.priceLevel : undefined,
            sort: filterOptions.sort,
            latitude: userCoordinates?.lat,
            longitude: userCoordinates?.lng,
            page: 0,
            limit: 20,
        });
        setFilteredItems(result.items);
        setPage(0);
        setHasMore(result.page + 1 < result.totalPages);
    } catch (err) {
        console.error("Failed to apply filters:", err);
        setError(err instanceof Error ? err : new Error('Failed to apply filters'));
    } finally {
        setIsLoading(false);
    }
}, [categorySlug, searchQuery, filterOptions, userCoordinates]);
```

- [ ] **Step 4: Обновить loadMore useEffect**

Найти `useEffect(() => { ... isIntersecting ... })` (примерно строка 196). Заменить вызов api в loadMoreItems:

```tsx
const result = await api.stores.search({
    categorySlug,
    search: searchQuery.trim() || undefined,
    minRating: filterOptions.minRating > 0 ? filterOptions.minRating : undefined,
    maxDistance: filterOptions.maxDistance < 10 ? filterOptions.maxDistance : undefined,
    openNow: filterOptions.openNow || undefined,
    priceLevel: filterOptions.priceLevel.length > 0 ? filterOptions.priceLevel : undefined,
    sort: filterOptions.sort,
    page: nextPage,
    latitude: userCoordinates?.lat,
    longitude: userCoordinates?.lng,
    limit: 20,
});
if (result.items.length > 0) {
    setFilteredItems(prev => [...prev, ...result.items]);
    setPage(nextPage);
    setHasMore(result.page + 1 < result.totalPages);
} else {
    setHasMore(false);
}
```

- [ ] **Step 5: Обновить resetFilters**

Найти `const resetFilters = async () => {...}`. Внутри try-блока:
```tsx
const result = await api.stores.search({
    categorySlug,
    latitude: userCoordinates?.lat,
    longitude: userCoordinates?.lng,
    page: 0,
    limit: 20,
});
setFilteredItems(result.items);
setPage(0);
setHasMore(result.page + 1 < result.totalPages);
```

- [ ] **Step 6: Verify typecheck**

```bash
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add src/app/category/[slug]/page.tsx
git commit -m "refactor(category-page): использовать api.stores.search со slug

Убран find() lookup категории по name.toLowerCase() — slug в URL == slug в БД.
Display name категории подтягивается через /categories/{slug} (новый endpoint).
latitude/longitude (не lat/lng) согласно контракту.
hasMore теперь из totalPages, не из item count >= 10."
```

---

## Task 6: Refactor `/restaurants/page.tsx`

**Files:**
- Modify: `src/app/restaurants/page.tsx`

- [ ] **Step 1: Прочитать целиком**

Текущая страница использует featured/nearby/recommended секции из 3 разных API. Контракт решает: переходим на простой `?type=RESTAURANT` фильтр.

- [ ] **Step 2: Заменить core data fetch на `api.stores.search`**

Найти `useEffect` с `fetchInitialData` (примерно строка 85). Заменить целиком на:

```tsx
useEffect(() => {
    const fetchInitialData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [categoriesResult, restaurantsResult] = await Promise.all([
                api.categories.getAll(),
                api.stores.search({
                    type: "RESTAURANT",
                    latitude: userCoordinates?.lat,
                    longitude: userCoordinates?.lng,
                    sort: "rating",
                    page: 0,
                    limit: 20,
                }),
            ]);
            setCategories(categoriesResult);
            setAllRestaurants(restaurantsResult.items);
            setFilteredRestaurants(restaurantsResult.items);
            setHasMore(restaurantsResult.page + 1 < restaurantsResult.totalPages);
        } catch (err) {
            console.error("Failed to fetch restaurant data:", err);
            setError(err instanceof Error ? err : new Error('Failed to fetch data'));
        } finally {
            setIsLoading(false);
        }
    };
    fetchInitialData();
}, [userCoordinates]);
```

- [ ] **Step 3: Удалить curated sections useEffects**

Найти и удалить:
- `useEffect` с `getNearbyRestaurants` (строка 171-185).
- `useEffect` с `fetchRecommendedRestaurants` (строка 188-206).
- `popularRestaurants` state и related useEffect (если он отдельно).

Удалить связанные state переменные:
```tsx
const [popularRestaurants, setPopularRestaurants] = useState<Store[]>([]);
const [nearbyRestaurants, setNearbyRestaurants] = useState<Store[]>([]);
const [recommendedRestaurants, setRecommendedRestaurants] = useState<Store[]>([]);
```

И связанные JSX блоки в return (секции "Popular Restaurants", "Nearby Restaurants", "Recommended Restaurants") — удалить полностью, оставить только "Всі ресторани".

- [ ] **Step 4: Переписать `applyFilters` useEffect под server-side filter**

Найти `useEffect(() => { const applyFilters = () => { ... } })` (строка 219). Заменить на:

```tsx
useEffect(() => {
    const applyFilters = async () => {
        if (!userCoordinates) return;
        try {
            const result = await api.stores.search({
                type: "RESTAURANT",
                categorySlug: selectedCategory ?? undefined,
                minRating: minRating > 0 ? minRating : undefined,
                maxDistance: maxDistance < 10 ? maxDistance : undefined,
                openNow: openNow || undefined,
                latitude: userCoordinates.lat,
                longitude: userCoordinates.lng,
                sort: "rating",
                page: 0,
                limit: 20,
            });
            setFilteredRestaurants(result.items);
            setPage(1);
            setHasMore(result.page + 1 < result.totalPages);
        } catch (err) {
            console.error("Failed to filter restaurants:", err);
        }
    };
    const t = setTimeout(applyFilters, 300);
    return () => clearTimeout(t);
}, [selectedCategory, minRating, maxDistance, openNow, userCoordinates]);
```

- [ ] **Step 5: Обновить `selectedCategory` тип**

В state declaration:
```tsx
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
```
Семантически теперь это slug. Переименовать в `selectedCategorySlug` для clarity (опционально), либо оставить.

- [ ] **Step 6: Verify typecheck + build**

```bash
npm run typecheck && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/app/restaurants/page.tsx
git commit -m "refactor(restaurants): server-side type=RESTAURANT filter

Удалены curated sections (popular/nearby/recommended) — было дублирование с главной,
плюс client-side имитация. Теперь одна секция \"Всі ресторани\" с серверной фильтрацией:
api.stores.search({ type: RESTAURANT, categorySlug, minRating, ... }).
Backend применяет фильтр (Phase 2). Filtered count из totalElements, hasMore из totalPages."
```

---

## Task 7: Заменить чтения `store.categoryName` на `store.category?.name`

**Files:** все .tsx где есть `categoryName`.

- [ ] **Step 1: Найти все вхождения**

```bash
grep -rn "categoryName" src/ --include="*.tsx" --include="*.ts" | grep -v "src/lib/api-schemas.ts"
```

- [ ] **Step 2: Заменить каждое**

В каждом файле:

**Шаблон 1 — отображение:**
```tsx
{store.categoryName}
```
→
```tsx
{store.category?.name ?? '—'}
```

**Шаблон 2 — сравнение:**
```tsx
store.categoryName?.toLowerCase() === selectedCategory.toLowerCase()
```
→
```tsx
store.category?.slug === selectedCategorySlug
```

**Шаблон 3 — построение URL:**
```tsx
href={`/category/${store.categoryName?.toLowerCase()}`}
```
→
```tsx
href={store.category?.slug ? `/category/${store.category.slug}` : '#'}
```

- [ ] **Step 3: Verify нет остатков**

```bash
grep -rn "\.categoryName" src/ --include="*.tsx" | grep -v "@deprecated\|api-schemas.ts"
```
Expected: пусто (или только закомментированные).

- [ ] **Step 4: Удалить `categoryName` из `Store` interface**

В `src/types/index.ts` убрать поле `categoryName?: string;` (если ещё осталось).

- [ ] **Step 5: Verify typecheck + lint + build**

```bash
npm run typecheck && npm run lint && npm run build
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: store.categoryName → store.category?.name

Контракт Phase 2: category стал first-class объектом. Backend ещё шлёт
deprecated categoryName 1 sprint, но фронт читает только category.{slug,name}.
Если category null (legacy запись) — UI показывает тире."
```

---

## Task 8: Smoke verification

**Цель:** убедиться что миграция работает end-to-end на реальном backend.

- [ ] **Step 1: Запустить dev server**

```bash
npm run dev
```
Ждать "Ready in Xs". Открыть http://localhost:9002.

- [ ] **Step 2: Smoke через playwright — главная**

В отдельном окне (или через playwright skill):
```
Открыть http://localhost:9002/
```
Expected: страница загружается, видны категории-чипы (10 канонических).
Console: нет красных ошибок про Zod parse.

- [ ] **Step 3: Smoke — клик на категорию**

Кликнуть чип "Pizza". URL должен стать `/category/pizza`. Видны рестораны категории.
Network: запрос `GET /stores?categorySlug=pizza&sort=rating&...`. Response: content non-empty.

- [ ] **Step 4: Smoke — фильтры**

На `/category/pizza` подвинуть minRating slider на 4. Подождать 300ms.
Expected: Network запрос с `minRating=4`. UI обновляется — карточки с rating ≥ 4.

- [ ] **Step 5: Smoke — `/restaurants`**

Открыть `/restaurants`. Network: запрос `GET /stores?type=RESTAURANT&latitude=...&longitude=...&sort=rating`.
Expected: видны рестораны (response totalElements > 0).

- [ ] **Step 6: Smoke — навигация**

Кликнуть на ссылку "Всі ›" возле "Популярні ресторани" на главной. Должен открыться `/restaurants`, не `/category/restaurant`.
Mobile nav (если есть) — иконка "Ресторани" ведёт на `/restaurants`.

- [ ] **Step 7: Если что-то не работает — debug через `systematic-debugging`**

Не патчить наугад — пройти Phase 1 (root cause).

- [ ] **Step 8: Финальный verification commit (если были фиксы)**

```bash
git add -A
git commit -m "fix: smoke verification fixes"
```

---

## Self-review checklist (executor должен проверить перед "готово")

- [ ] Все 7 файлов из File structure действительно изменены (grep по таблице).
- [ ] Нет вхождений `category/restaurant` в `src/`.
- [ ] Нет вхождений `\.categoryName` в `src/` (кроме `api-schemas.ts` и `@deprecated`-комментариев).
- [ ] Нет вхождений `lat:` / `lng:` в API параметрах в `src/lib/api.ts` (должны быть `latitude`/`longitude`).
- [ ] `npm run typecheck` чистый.
- [ ] `npm run lint` чистый.
- [ ] `npm run build` собирается.
- [ ] Smoke (Task 8) пройдена.
- [ ] Все коммиты используют Conventional Commits с русским описанием.
- [ ] Нет `Co-Authored-By: Claude` в коммитах.

---

## Risks / known unknowns

1. **`/restaurants` страница использует `RestaurantMap`** — компонент карты. Контракт не упоминает изменений в координатах. Если карта читает `store.coordinates` (frontend shape) — backend всё ещё шлёт `location: {latitude, longitude}`. Маппинг в `mapStoreImageFields` ничего такого не делает. Возможно потребуется добавить `coordinates: { lat: location.latitude, lng: location.longitude }` маппинг — проверить в Task 6/8.

2. **`fetchNearbyRestaurants` / `fetchRestaurantsWithDistances`** в `src/services/api-service.ts` — могут читать поля старого shape. Если используются в других местах — out of scope этой миграции, оставить как есть; в `/restaurants` мы их перестали вызывать.

3. **`category-card.tsx`** может читать `restaurant.categoryName` — учтено в Task 7.

4. **Backend регрессии** — если контракт не реализован полностью (например `/categories/{slug}` 404), Task 5 catch уже это обрабатывает (display name fallback на slug).

5. **Production bundle на :3000** — после миграции его нужно пересобрать (`docker build` или `npm run build` + redeploy). Это вне scope frontend изменений, но без этого пользователь не увидит изменений на :3000. Dev на :9002 будет работать сразу.
