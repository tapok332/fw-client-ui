# Stores API — Contract (Phase 2 frontend brief)

> **Что это.** Контракт `fw-store-service` после backend-фазы 2026-05-17 (`StoreType` + `Category.slug` + sort whitelist + читаемый seed). Документ для frontend-агента: что прислать, что получить, на что мигрировать, какие фолбэки оставить.
>
> **Base URL.** Всегда через gateway: `http://localhost:8080` (env `API_BASE_URL`). Не на прямые порты микросервисов.
>
> **Auth.** Endpoints ниже публичны (через `PUBLIC_PATHS` гейтвея). `POST /categories`, `POST /stores` — `@PreAuthorize("hasRole('ADMIN')")`, нужен `Authorization: Bearer <JWT>`. Frontend в общем случае дёргает только GET-эндпоинты этого документа.
>
> **Response envelope.** Любой 2xx-ответ обёрнут в `ApiResponse<T>`:
> ```json
> { "success": true, "data": <T>, "error": null }
> ```
> Ошибки:
> ```json
> { "success": false, "data": null, "error": { "code": "BAD_REQUEST", "message": "Unknown sort: password" } }
> ```

---

## 1. Что изменилось vs предыдущая версия

| Область | Раньше | Теперь |
|---|---|---|
| **Категории** | `name` свободно, `Asian-1777468007` (timestamp suffix), 80 дубликатов | 10 канонических, `{id, slug, name, iconName}`. Сеется идемпотентно из backend |
| **Идентификатор категории в URL фронта** | хардкод/slug-с-таймстампом | `slug` ∈ {`pizza`, `sushi`, `bakery`, `asian`, `burgers`, `coffee`, `dessert`, `vegan`, `pastry`, `greek`} |
| **Тип заведения** | отсутствовал; всё было «категория» | новое поле `StoreType` (макро-классификация) |
| **Store DTO** | `categoryName: string` | `category: CategoryDto`. Поле `categoryName` оставлено **deprecated** (mirror `category.name`), удалить через 1 sprint |
| **`GET /stores` params** | большинство тихо игнорировалось | полный контракт работает (см. §3) |
| **Невалидный sort** | тихо игнорировался (по умолчанию по id) | `400 Bad Request` с понятным message |
| **`GET /categories/{slug}`** | не было | новый endpoint |

---

## 2. Сущности

### `StoreType` (enum)

```ts
type StoreType = "RESTAURANT" | "GROCERY" | "BAKERY" | "CAFE" | "SWEETS" | "OTHER";
```

Передаётся в JSON как строка. Принимается в query как строка. Дефолт при создании — `RESTAURANT`.

### `CategoryDto`

```ts
interface CategoryDto {
  id: string;        // UUID
  slug: string;      // ^[a-z0-9-]+$, e.g. "pizza"
  name: string;      // display, e.g. "Pizza"
  iconName: string | null;   // hint для UI icon set, e.g. "pizza", "fish", "coffee"
}
```

### `StoreDto`

```ts
interface StoreDto {
  id: string;
  name: string;
  type: StoreType;                    // НОВОЕ
  category: CategoryDto | null;       // НОВОЕ — заменяет categoryName
  description: string | null;
  imageUrl: string | null;
  heroImageUrl: string | null;
  address: string | null;
  location: { latitude: number; longitude: number } | null;
  rating: number | null;              // 0.0..5.0, 1 знак после запятой
  opensAt: string | null;             // "HH:mm:ss"
  closesAt: string | null;
  phone: string | null;
  website: string | null;
  deliveryFee: number | null;
  minOrderAmount: number | null;
  priceLevel: number | null;          // 1..4
  currentlyOpen: boolean;             // вычисляется в timezone сервиса (Europe/Kyiv)
  menuItems: MenuItemDto[];           // пустой для search
  combos: ComboDto[];                 // пустой для search
  distance: number | null;            // метры; null для search-результатов, заполняется только в GET /stores/{id}?latitude&longitude

  /** @deprecated mirror of category.name, удалить когда мигрируют все читатели */
  categoryName: string | null;
}
```

---

## 3. `GET /stores`

### Query parameters (все опциональны кроме `page`/`limit` с дефолтами)

| Параметр | Тип | Default | Семантика |
|---|---|---|---|
| `search` | string | — | LIKE `%search%` по `name` OR `description` (case-insensitive) |
| `type` | `StoreType` | — | exact match по `store.type` |
| `categoryId` | UUID | — | exact match по `store.category.id`. **Приоритет над `categorySlug` если переданы оба** |
| `categorySlug` | string `^[a-z0-9-]+$` | — | exact match по `store.category.slug` |
| `latitude` | number (-90..90) | — | широта пользователя (WGS84). Шлётся вместе с `longitude` |
| `longitude` | number (-180..180) | — | долгота пользователя |
| `minRating` | number 0..5 | — | `store.rating >= minRating` (inclusive) |
| `maxDistance` | number > 0 | — | в **километрах**. Применяется только если переданы `latitude` + `longitude`. PostGIS `ST_DWithin` |
| `openNow` | boolean | `false` | `true` → только заведения, чьё окно `opensAt..closesAt` содержит текущее время в `Europe/Kyiv`. Поддерживается overnight (22:00–02:00) |
| `priceLevel` | `int[]` (multi-value) | — | `store.priceLevel IN (...)`. **Multi-value**: `?priceLevel=1&priceLevel=2` |
| `sort` | string | `relevance` | whitelist: `distance` \| `rating` \| `priceAsc` \| `priceDesc` \| `relevance`. Direction-суффикс допустим (`rating,desc`) но игнорируется — направление intrinsic enum-у. Unknown value → **400** |
| `page` | int | `0` | 0-based |
| `limit` | int 1..100 | `20` | hard cap 100, ниже 1 коэрсится в 20 |

### Sort semantics

| `sort=` | Поведение |
|---|---|
| `distance` | ASC по `ST_Distance` от (`latitude`, `longitude`). Без координат — fallback в `relevance` |
| `rating` | DESC по `rating` |
| `priceAsc` | ASC по `priceLevel` |
| `priceDesc` | DESC по `priceLevel` |
| `relevance` / пусто | без явного порядка (PK) |

### Response

`ApiResponse<Page<StoreDto>>`. `data` — стандартный Spring `Page`:

```json
{
  "success": true,
  "data": {
    "content": [ /* StoreDto[] */ ],
    "totalElements": 10,
    "totalPages": 1,
    "size": 20,
    "number": 0,
    "first": true,
    "last": true,
    "empty": false,
    "numberOfElements": 10,
    "pageable": { "pageNumber": 0, "pageSize": 20, "offset": 0 },
    "sort": { "sorted": true, "unsorted": false, "empty": false }
  },
  "error": null
}
```

### Примеры

```bash
# Все стораны, отсортировано по рейтингу
GET /stores?sort=rating

# Пиццерии в радиусе 1 км от пользователя
GET /stores?categorySlug=pizza&latitude=50.45&longitude=30.52&maxDistance=1

# Тип RESTAURANT + минимальный рейтинг 4.0, multi-value цены
GET /stores?type=RESTAURANT&minRating=4.0&priceLevel=1&priceLevel=2

# Открытые сейчас
GET /stores?openNow=true&latitude=50.45&longitude=30.52
```

### Edge cases / гарантии

- **Если параметр пустой/null** — фильтр не применяется (не `WHERE x IS NULL`).
- **`maxDistance` без координат** — игнорируется (нет точки отсчёта).
- **`sort=distance` без координат** — fallback в `relevance`, не 400.
- **Multi-value `priceLevel`** требует именно повторения ключа: `?priceLevel=1&priceLevel=2`. Запятая (`?priceLevel=1,2`) **не работает**, Spring парсит как один элемент `"1,2"` и упадёт парсингом int → 400.
- **`limit > 100`** молча коэрсится в 100.
- **`page < 0` / `limit < 1`** молча в `0` / `20`.
- **Unknown `type`** (например `?type=FOO`) → 400 (Spring enum binding).
- **Unknown `sort`** → 400 с message `Unknown sort: <value>`.
- **`categoryId` + `categorySlug`** одновременно — `categoryId` выигрывает.

---

## 4. `GET /stores/{id}`

| Параметр | Тип | Default | Семантика |
|---|---|---|---|
| `latitude` | number | — | если оба переданы — заполняет `distance` в ответе (метры) |
| `longitude` | number | — | то же |

Response: `ApiResponse<StoreDto>`. Тут `menuItems` и `combos` заполнены реальными данными (в отличие от поиска).

**404** если store не существует.

---

## 5. `GET /home/categories`

Возвращает все 10 канонических категорий.

Response:
```json
{
  "success": true,
  "data": [
    {"id": "...", "slug": "pizza",   "name": "Pizza",   "iconName": "pizza"},
    {"id": "...", "slug": "sushi",   "name": "Sushi",   "iconName": "fish"},
    {"id": "...", "slug": "bakery",  "name": "Bakery",  "iconName": "croissant"},
    {"id": "...", "slug": "asian",   "name": "Asian",   "iconName": "noodles"},
    {"id": "...", "slug": "burgers", "name": "Burgers", "iconName": "burger"},
    {"id": "...", "slug": "coffee",  "name": "Coffee",  "iconName": "coffee"},
    {"id": "...", "slug": "dessert", "name": "Dessert", "iconName": "cake"},
    {"id": "...", "slug": "vegan",   "name": "Vegan",   "iconName": "leaf"},
    {"id": "...", "slug": "pastry",  "name": "Pastry",  "iconName": "cookie"},
    {"id": "...", "slug": "greek",   "name": "Greek",   "iconName": "olive"}
  ],
  "error": null
}
```

Кэшируется в backend (`@Cacheable`). Frontend может смело кэшировать на уровне сессии.

---

## 6. `GET /categories/{slug}` (новое)

Резолв одной категории по slug. Полезно для category page header (display name по URL-параметру).

```bash
GET /categories/pizza
```

Response:
```json
{
  "success": true,
  "data": {"id": "2b9a04dc-...", "slug": "pizza", "name": "Pizza", "iconName": "pizza"},
  "error": null
}
```

**404** если slug не найден.

---

## 7. `GET /home/featured-stores`, `/home/stores/nearby`, `/home/boxes`

Не менялись. Те же URL/params/shape, что и до сих пор. Учтите только, что `Store.categoryName` теперь — deprecated computed (см. §2).

---

## 8. Frontend migration guide

### 8.1. TypeScript типы

```ts
// types/index.ts

export type StoreType = "RESTAURANT" | "GROCERY" | "BAKERY" | "CAFE" | "SWEETS" | "OTHER";

export interface Category {
  id: string;
  slug: string;
  name: string;
  iconName: string | null;
}

export interface Store {
  id: string;
  name: string;
  type: StoreType;
  category: Category | null;
  description: string | null;
  imageUrl: string | null;
  heroImageUrl: string | null;
  // ... остальные поля как были

  /** @deprecated use `category.name`. Будет удалено в ближайший sprint. */
  categoryName?: string | null;
}

export interface StoreSearchParams {
  search?: string;
  type?: StoreType;
  categoryId?: string;
  categorySlug?: string;
  latitude?: number;
  longitude?: number;
  minRating?: number;
  maxDistance?: number;     // в км
  openNow?: boolean;
  priceLevel?: number[];
  sort?: "distance" | "rating" | "priceAsc" | "priceDesc" | "relevance";
  page?: number;
  limit?: number;
}
```

### 8.2. Маршруты

- `/category/[slug]` — параметр маршрута это **slug** (e.g. `/category/pizza`). НЕ имя категории, НЕ UUID. Резолв display-name делать через `GET /categories/{slug}` или поиск в кэшированном `/home/categories`.
- Новый маршрут `/restaurants` — список всех `?type=RESTAURANT`. Передавайте `type=RESTAURANT` в `GET /stores`. Аналогично для других типов если будет нужно (`/groceries`, `/cafes`, …).

### 8.3. API клиент

`api.stores.getByCategory` сейчас принимает `categoryId: string` (UUID). После миграции — принимать `slug` и слать `?categorySlug=`. Пример query-builder через `URLSearchParams`:

```ts
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
  // multi-value!
  (params.priceLevel ?? []).forEach(level => qs.append("priceLevel", String(level)));
  return qs.toString();
}
```

### 8.4. Чтение `category` в UI

```tsx
// БЫЛО
<span>{store.categoryName}</span>

// СТАЛО
<span>{store.category?.name ?? "—"}</span>

// Для ссылки в URL — slug, не name
<Link href={`/category/${store.category?.slug}`}>{store.category?.name}</Link>
```

### 8.5. Что выбрасывать

- Любую логику «парсим slug = `name-timestamp`» — больше не нужна, slug в URL == slug в БД.
- Любой client-side filter по category после fetch — он был там потому что backend игнорировал параметр; теперь фильтрация серверная.
- Хардкод `restaurant` как «категории» — это `type`, не category.

---

## 9. Sort handling в UI

Sort options на фронте:

```ts
const SORT_OPTIONS = [
  { value: "rating",    label: "Rating (high → low)" },
  { value: "distance",  label: "Distance" },        // показывать только если есть геолокация
  { value: "priceAsc",  label: "Price (low → high)" },
  { value: "priceDesc", label: "Price (high → low)" },
] as const;
```

`sort=distance` шлите только если есть `latitude`+`longitude` (иначе backend сделает fallback в relevance — не ошибка, просто бесполезно).

---

## 10. Open-now индикатор

`StoreDto.currentlyOpen` уже вычислен в backend (timezone `Europe/Kyiv`, поддерживает overnight). НЕ вычисляйте сами на фронте — frontend и сервер могут не сойтись в timezone клиента.

Для фильтра «открыто сейчас» шлите `?openNow=true` (это серверный фильтр), не фильтруйте `content.filter(s => s.currentlyOpen)` после загрузки — это поломает `totalElements` и pagination.

---

## 11. Distance

- В response поиска (`GET /stores?...`): `distance: null` всегда. Если нужно показать км — посчитайте сами через haversine на фронте (есть `store.location.latitude/longitude` + позиция юзера). Это **намеренно** — серверный сорт по distance работает, но возвращать exact distance в каждом store-search-результате backend пока не делает.
- В response одного store (`GET /stores/{id}?latitude&longitude`): `distance` в **метрах** (PostGIS `ST_Distance` на geography type).

---

## 12. Error handling

| HTTP | Когда |
|---|---|
| **400** | malformed/unknown param (`type=FOO`, `sort=password`, `priceLevel=abc`) |
| **404** | `GET /stores/{id}` или `GET /categories/{slug}` — не найдено |
| **5xx** | server error; frontend retry с backoff (см. существующий `fetchAPI` wrapper) |

Body на 4xx — тот же `ApiResponse` envelope с `success:false` + `error.code` + `error.message`. Покажите `error.message` пользователю (он уже на русском/английском в зависимости от backend конфигурации) или замапьте `error.code` на свой локализованный текст.

---

## 13. Канонический список slugs

Hardcoded fallback на фронте (если `/home/categories` ещё не загрузился — для CSR-роутов):

```ts
export const CANONICAL_CATEGORY_SLUGS = [
  "pizza", "sushi", "bakery", "asian", "burgers",
  "coffee", "dessert", "vegan", "pastry", "greek",
] as const;
export type CategorySlug = typeof CANONICAL_CATEGORY_SLUGS[number];
```

При несовпадении (например юзер вручную ввёл `/category/unknown-slug`) — показывайте empty state, не ходите в API.

---

## 14. Что нельзя забыть

1. **Удалить** все обращения к `store.categoryName` после миграции на `store.category?.name`. Frontend bundle перестанет компилироваться при удалении deprecated поля из backend через 1 sprint.
2. **Удалить** any/all client-side filtering, который был обходом сломанной серверной фильтрации.
3. **Не передавать** category UUID туда, где теперь ожидается slug (URL-роуты).
4. **Передавать** `priceLevel` как массив через `?priceLevel=1&priceLevel=2`, не CSV.
5. **Не считать** `currentlyOpen` на клиенте.
6. **Не выкидывать** existing `categoryName` сразу — оставьте transitional read до удаления в backend.
