# Backend: добавить StoreType + Category.slug, починить фильтрацию и seed

> **Аудитория:** backend-агент (Spring Boot микросервис, который владеет таблицами `Store` и `Category` и эндпоинтом `GET /stores`).
> **Источник задачи:** frontend-расследование `fw-client-ui`, дата 2026-05-17. Все evidence ниже собраны прямым диалогом с реальным backend на `localhost:8080`.

---

## Контекст: что не так сейчас

Frontend (Next.js 15, `fw-client-ui`) при переходе на `/category/restaurant` показывает «Нічого не знайдено», несмотря на 80 записей в БД. Расследование (через playwright + прямые curl-запросы к `:8080`) выявило **три независимых дефекта в backend**, без фикса которых frontend никогда не покажет данные правильно.

### Дефект 1 — `GET /stores` игнорирует все query-параметры фильтрации и сортировки

Два запроса к одному и тому же endpoint возвращают **идентичный response**:

```
GET /stores
GET /stores?category=restaurant&lat=50.4501&lng=30.5234&minRating=5&sort=rating
```

В обоих случаях `totalElements=80`, тот же первый элемент (`Store-Asian-1777468007`, `rating: 4.5`), `sort.sorted=false`. То есть backend делает `storeRepository.findAll(pageable)` без `Specification` и без `Sort`.

### Дефект 2 — `Category.name` и `Store.categoryName` поломаны seed-данными

`GET /home/categories` возвращает 80 категорий вида:

```json
[
  {"id": "dd653a73-…", "name": "Bakery-1777468007"},
  {"id": "d4a8ff73-…", "name": "Sushi-1777468007"},
  {"id": "ab95cdea-…", "name": "Pizza-1777468007"},
  …
  {"id": "85289f11-…", "name": "Greek-1777478480"}
]
```

То есть seed-генератор пишет в `Category.name` уникальную строку с timestamp suffix вместо нормализованного имени. Аналогично `Store.categoryName` хранит `Asian-1777468007`, `Greek-1777468232`, `Pizza-1777469320` — уникальное значение для каждой записи. Это делает невозможным любую фильтрацию по категории, даже после фикса дефекта 1.

### Дефект 3 — нет концепции «тип заведения» (restaurant, grocery, cafe…)

Сейчас у `Store` единственное поле классификации — `categoryName` (свободная строка). Frontend хардкодит ссылки на `/category/restaurant` (4 места в коде), но `restaurant` — это **тип заведения**, не кухня. В backend модели нет ни такого enum-а, ни поля.

Frontend и backend нужно привести к одной онтологии:
- **Тип заведения** (`RESTAURANT`, `GROCERY`, `CAFE`, `BAKERY`, …) — макро-классификация. Фиксированный enum, не data-driven.
- **Категория = кухня** (`Asian`, `Pizza`, `Sushi`, …) — first-class entity с FK от `Store`. Это микро-классификация внутри типа.

---

## Goal

Реализовать backend контракт, который позволяет frontend-у:

1. Открыть `/restaurants` (или `/?type=RESTAURANT`) и получить только рестораны.
2. Открыть `/category/pizza` (по slug-у категории) и получить только заведения с кухней «Pizza», независимо от типа.
3. Комбинировать оба фильтра: «рестораны с азиатской кухней, рейтинг ≥ 4, отсортированные по рейтингу».
4. Строить URL-ы из реальных API-данных (`category.slug`), не из хардкода.

---

## Требования к доменной модели

### `StoreType` enum (новое)

```java
public enum StoreType {
    RESTAURANT,
    GROCERY,
    BAKERY,
    CAFE,
    SWEETS,
    OTHER
}
```

Persistence — `@Enumerated(EnumType.STRING)`. **Не `ORDINAL`** — иначе порядок enum-а ломает БД при добавлении значений.

### `Store` entity (модифицировать)

- Добавить поле `type: StoreType` (NOT NULL).
- Убрать строковое поле `categoryName` (или оставить как deprecated для совместимости, но не использовать).
- Заменить на `@ManyToOne` связь:
  ```java
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "category_id", nullable = false)
  private Category category;
  ```

### `Category` entity (модифицировать)

```java
@Entity
@Table(name = "categories", uniqueConstraints = @UniqueConstraint(columnNames = "slug"))
public class Category {
    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String slug;       // URL-friendly: "pizza", "asian", "bakery"

    @Column(nullable = false)
    private String name;       // Display: "Pizza", "Asian", "Bakery"

    private String iconName;   // опционально
    // existing fields stay
}
```

`slug` обязателен, уникален, формат `^[a-z0-9-]+$` (валидировать через `@Pattern`).

### Миграция (Flyway или Liquibase)

Согласно правилам репо — migrations mandatory, никаких `ddl-auto=update` в production. См. `~/.claude/rules/database.md`.

Шаги миграции:

```sql
-- V20260517_001__add_store_type_and_category_slug.sql
ALTER TABLE stores ADD COLUMN type VARCHAR(32);
ALTER TABLE categories ADD COLUMN slug VARCHAR(64);

-- Backfill (см. секцию «Seed» ниже про нормализацию)
-- (миграция данных — отдельный shell или Java-based migration)

ALTER TABLE stores ALTER COLUMN type SET NOT NULL;
ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;
ALTER TABLE categories ADD CONSTRAINT uq_categories_slug UNIQUE (slug);

ALTER TABLE stores ADD COLUMN category_id BINARY(16);   -- или UUID для Postgres
ALTER TABLE stores ADD CONSTRAINT fk_stores_category
    FOREIGN KEY (category_id) REFERENCES categories(id);
CREATE INDEX idx_stores_category_id ON stores(category_id);
CREATE INDEX idx_stores_type ON stores(type);
```

После заполнения `category_id` — drop `category_name`.

**Каждая миграция immutable после merge. Breaking changes — в 2 шага** (см. правила `database.md`).

---

## Требования к API endpoints

### `GET /stores`

Сейчас принимает все параметры, но игнорирует их. Должно:

| Query param | Тип | Поведение |
|---|---|---|
| `type` | `StoreType` (optional) | Фильтр по `store.type` |
| `categorySlug` | `String` (optional) | Фильтр по `store.category.slug` |
| `categoryId` | `UUID` (optional) | Альтернатива `categorySlug` (выбирается одно или другое) |
| `minRating` | `BigDecimal` (optional) | `store.rating >= :minRating` |
| `maxDistance` | `BigDecimal` (optional) | Только если переданы `lat`/`lng` — фильтр через PostGIS `ST_DWithin` |
| `openNow` | `Boolean` (optional) | `store.currentlyOpen = true` И текущее время ∈ `[opensAt, closesAt]` |
| `priceLevel` | `List<Integer>` (optional, multi-value) | `store.priceLevel IN (:levels)` |
| `lat`, `lng` | `Double` (optional, оба или ни одного) | Базовая точка для расчёта `distance` в response |
| `search` | `String` (optional) | LIKE `%search%` по `name`/`description` (case-insensitive) |
| `page`, `size` | `int` (default 0, 20) | Pagination |
| `sort` | `String` (optional) | Whitelist: `rating`, `priceLevel`, `distance`. Direction: `rating,desc` или просто `rating` (default desc для rating) |

Реализация через `JpaSpecificationExecutor<Store>` + `StoreSpecification` (Specifications combinable, см. spring-boot.md секция Specifications). Sort — через `Sort.by(...)` с whitelist полей (чтобы избежать SQL injection через `?sort=password`).

**Response shape — НЕ менять** (frontend ожидает Spring Page format):

```json
{
  "success": true,
  "data": {
    "content": [/* StoreDto[] */],
    "totalElements": 80,
    "totalPages": 4,
    "pageable": { "pageNumber": 0, "pageSize": 20, ... },
    "sort": { "sorted": true, ... }
  }
}
```

В `StoreDto` добавить:

```java
public record StoreDto(
    UUID id,
    String name,
    StoreType type,                // NEW
    CategoryDto category,          // NEW — заменяет categoryName
    String description,
    String imageUrl,
    String heroImageUrl,
    AddressDto address,
    GeoLocation location,
    BigDecimal rating,
    LocalTime opensAt,
    LocalTime closesAt,
    boolean currentlyOpen,
    BigDecimal deliveryFee,
    BigDecimal minOrderAmount,
    int priceLevel,
    Double distance,               // null если lat/lng не переданы
    // ... existing
) {}

public record CategoryDto(UUID id, String slug, String name, String iconName) {}
```

**Сохранить deprecated поле `categoryName` в DTO** (равное `category.name`) на 2 версии для backward compat — frontend ещё может его читать. Удалить через 1 sprint после миграции frontend.

### `GET /home/categories`

Сейчас возвращает 80 категорий с timestamp suffix. Должно возвращать список нормализованных категорий (≤ 20 штук) с обязательным `slug`.

Response:

```json
{
  "success": true,
  "data": [
    {"id": "...", "slug": "pizza",   "name": "Pizza",   "iconName": "pizza"},
    {"id": "...", "slug": "sushi",   "name": "Sushi",   "iconName": "fish"},
    {"id": "...", "slug": "bakery",  "name": "Bakery",  "iconName": "croissant"},
    {"id": "...", "slug": "asian",   "name": "Asian",   "iconName": "noodles"},
    …
  ]
}
```

### `GET /categories/{slug}` (опционально, новое)

Возвращает одну категорию по slug. Полезно для frontend-а — подтянуть display name для заголовка category page. Если не делаешь — frontend подтянет через `/home/categories` и закеширует.

### Существующие endpoints — не ломать

`/home/featured-stores`, `/home/stores/nearby`, `/home/boxes`, `/home/hero-images`, `/home/category-icons`, `/stores/{id}`, `/orders/*`, `/addresses/*`, `/auth/*` — оставить как есть. Их frontend использует и они не входят в scope этой задачи.

---

## Seed data

**Критично — это часть task'а, не «потом починим».** Без нормализованных seed-ов фронт всё равно не покажет данные.

1. **Удалить старый seed**, который генерирует `Bakery-{timestamp}`, `Asian-{timestamp}`, …
2. **Идемпотентный seed категорий** (выполняется при старте, проверяет существование по `slug`):
   ```
   pizza, sushi, bakery, asian, burgers, coffee, dessert, vegan, pastry, greek
   ```
   (плюс/минус — финальный список на твоё усмотрение, главное: фиксированный, без timestamp, ≤ 20).

3. **Seed `Store`** — каждому store присвоить:
   - `type` (из enum) — большинство `RESTAURANT`, часть `BAKERY`/`CAFE`/`GROCERY` для разнообразия.
   - `category` — FK на одну из посеянных категорий.
   - `rating` — разнообразный (3.5, 4.0, 4.2, 4.5, 4.7, 4.8, 4.9, 5.0). **Сейчас все 4.5 — это нерепрезентативный seed**, фильтр `minRating` нечем тестировать. Сделай распределение.

4. **`SeedRunner` — идемпотентный**. Проверяй `categoryRepository.findBySlug(...)` перед insert. Иначе при каждом рестарте контейнера будут дубли.

---

## Acceptance criteria

Тестируй curl-ами на запущенном сервисе:

### AC1 — категории нормализованы

```bash
curl -s localhost:8080/home/categories | jq '.data | length, .data[0]'
```

Ожидание: длина ≤ 20, первый элемент имеет поля `id`, `slug`, `name` — name без timestamp.

### AC2 — фильтр по type работает

```bash
curl -s 'localhost:8080/stores?type=RESTAURANT&size=5' | jq '.data | {totalElements, types: [.content[].type] | unique}'
curl -s 'localhost:8080/stores?type=BAKERY&size=5'     | jq '.data | {totalElements, types: [.content[].type] | unique}'
```

Ожидание: `totalElements` для разных типов разные, `types` массив содержит только запрошенный.

### AC3 — фильтр по categorySlug работает

```bash
curl -s 'localhost:8080/stores?categorySlug=pizza&size=5' | jq '.data | {totalElements, slugs: [.content[].category.slug] | unique}'
```

Ожидание: `slugs == ["pizza"]`, `totalElements > 0`.

### AC4 — фильтр по minRating работает

```bash
curl -s 'localhost:8080/stores?minRating=4.5&size=5' | jq '.data | {totalElements, ratings: [.content[].rating] | unique | sort}'
curl -s 'localhost:8080/stores?minRating=5.0&size=5' | jq '.data | {totalElements, ratings: [.content[].rating] | unique | sort}'
```

Ожидание: `ratings` все ≥ запрошенному minRating. `totalElements` уменьшается с ростом minRating.

### AC5 — sort работает

```bash
curl -s 'localhost:8080/stores?sort=rating,desc&size=10' | jq '.data | {sorted: .sort.sorted, ratings: [.content[].rating]}'
```

Ожидание: `sorted: true`, массив `ratings` отсортирован по убыванию.

### AC6 — комбинация фильтров

```bash
curl -s 'localhost:8080/stores?type=RESTAURANT&categorySlug=asian&minRating=4.0&sort=rating,desc' \
  | jq '.data | {totalElements, sample: .content[0] | {type, slug: .category.slug, rating}}'
```

Ожидание: `sample.type == "RESTAURANT"`, `sample.slug == "asian"`, `sample.rating >= 4.0`.

### AC7 — невалидный sort field отвергнут

```bash
curl -s -o /dev/null -w '%{http_code}' 'localhost:8080/stores?sort=password,desc'
```

Ожидание: `400` (или ignore + sort=default; **не 500, не sort по password**).

### AC8 — обратная совместимость

Старые запросы без новых параметров продолжают работать:

```bash
curl -s 'localhost:8080/stores?size=5' | jq '.data.totalElements'
curl -s 'localhost:8080/stores/{any-existing-id}' | jq '.data.id'
curl -s 'localhost:8080/home/featured-stores' | jq '.data | length'
```

Ожидание: 200 OK, нормальный response, нет регрессий.

---

## TDD требования

**Это mandatory согласно правилам проекта.** См. `~/.claude/rules/spring-boot.md` (Testing pyramid) и `~/.claude/rules/database.md` (Testcontainers mandatory).

1. **Unit тесты** для `StoreSpecification` — каждое сочетание условий, edge cases (null params, empty list).
2. **`@DataJpaTest` + Testcontainers** для `StoreRepository.findAll(Specification, Pageable)` — реальная БД (MySQL или Postgres, что в проекте). **Не H2.** H2 врёт про SQL-совместимость.
3. **`@SpringBootTest` + `@ServiceConnection`** для controller — полный flow с реальной БД.
4. **Контрактные тесты на response shape** — например через `@AutoConfigureMockMvc` + JsonPath assertions. Frontend полагается на конкретные поля (`data.content[].category.slug`, `data.totalElements`).

Test naming: `should_<expected>_when_<condition>` или `given_<state>_when_<action>_then_<outcome>`. Запрещены `test1`, `testSomething`.

Reuse containers:
```properties
# ~/.testcontainers.properties
testcontainers.reuse.enable=true
```

И `.withReuse(true)` в container declaration.

---

## Non-goals

Что **не входит** в эту задачу (отдельные тикеты):

1. **Расчёт `distance` через PostGIS** для `maxDistance` фильтра — если PostGIS не настроен, можно вернуть `null` в `distance` и игнорировать `maxDistance`. Frontend толерантен.
2. **Polymorphic category hierarchy** (parent/child категории) — пока flat.
3. **Localization** имени категории — `name` пока одноязычный. Frontend сам переводит через i18n.
4. **Кэширование `/home/categories`** — пока без кэша, потом по метрикам.
5. **Изменения других endpoints** (`/orders`, `/auth`, etc.) — out of scope.

---

## Security self-check (обязательно перед merge)

См. `~/.claude/rules/security.md`. Применимые пункты для этой задачи:

- [ ] `sort` параметр — whitelist полей. Никакого dynamic SQL из `sort=<userInput>`.
- [ ] `priceLevel` — валидация (только integers 1..4).
- [ ] `categorySlug` — Bean Validation `@Pattern("^[a-z0-9-]+$")` либо в Specification использовать только parameterized queries (никакой string concat).
- [ ] Pagination — enforce `size` cap (max 100), default 20. Иначе `?size=1000000` уронит heap.
- [ ] Dependency scan чистый (`./gradlew dependencyCheckAnalyze` или Snyk) — нет HIGH/CRITICAL CVE.
- [ ] OpenAPI annotations (`@Operation`, `@ApiResponse`) — для всех новых параметров.

---

## Verification gate (перед «готово»)

См. `~/.claude/rules/spring-boot.md` секция «Self-Check для Spring кода»:

- [ ] Все 8 AC из секции выше проходят (запусти curl-команды).
- [ ] Unit + Integration тесты проходят (`./gradlew test integrationTest`).
- [ ] Нет `@Autowired` на полях/setter-ах — только constructor injection.
- [ ] `Store.category` — `FetchType.LAZY` (не `EAGER`, иначе N+1).
- [ ] Controller не содержит business logic (< 10 строк на метод, только маппинг + вызов use case).
- [ ] DTO отдельны от `@Entity`.
- [ ] OpenAPI doc на `/v3/api-docs` отражает новый контракт.
- [ ] Domain классы не зависят от Spring/JPA/Jackson (если используется hexagonal — см. spring-boot.md).
- [ ] Pre-commit hook (`gitleaks`) прошёл — нет секретов в diff.

---

## Commit style

Conventional commits на русском (см. главный CLAUDE.md секция Git):

```
feat(api): добавить фильтр по StoreType и Category.slug в GET /stores

- StoreType enum (RESTAURANT, GROCERY, BAKERY, CAFE, SWEETS, OTHER)
- Category.slug поле + unique constraint + migration
- StoreSpecification: type, categorySlug, minRating, openNow, priceLevel
- Sort whitelist (rating, priceLevel, distance)
- Идемпотентный seed категорий (10 кухонь без timestamp suffix)
- Integration-тесты через Testcontainers (8 AC покрыты)

refs(DEV-XXX): фильтрация на странице категории frontend
```

(Замени `DEV-XXX` на реальный JIRA-ключ, если есть.)

---

## Frontend ожидания (контракт)

Frontend после твоего фикса будет ожидать:

1. `GET /home/categories` → массив с полями `id`, `slug`, `name`, `iconName`. `slug` обязательно.
2. `GET /stores?type=RESTAURANT&categorySlug=pizza&minRating=4&sort=rating,desc` → Spring Page с фильтрованным контентом, `data.content[].category.slug` доступен.
3. `StoreDto.type` присутствует в каждом store.
4. `StoreDto.category` — объект с `{id, slug, name}`, не плоская строка.
5. Старое поле `StoreDto.categoryName` остаётся deprecated на 1 sprint (frontend параллельно мигрирует).

Frontend changes делаются параллельно — координация через staging environment.

---

## Если нужно уточнение

Если что-то в требованиях неясно — спрашивай у тимлида frontend (vs угадывать). Особенно по:
- Финальному списку категорий (slug-ам).
- Распределению StoreType в seed.
- Whitelist полей для `sort`.
- Нужна ли мне `categoryId` или хватает `categorySlug`.

Решения фиксируй в Y-statement (см. главный CLAUDE.md секция Pushback Protocol) либо в ADR (`docs/decisions/`).
