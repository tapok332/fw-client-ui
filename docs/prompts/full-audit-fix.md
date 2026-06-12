# FoodWise — Full Project Audit & Fix

Ты работаешь с проектом **FoodWise** — Next.js 15 App Router, React 18, TypeScript. Прочитай CLAUDE.md в корне проекта для полного контекста архитектуры.

Твоя задача — провести полный аудит проекта, найти ВСЕ ошибки и проблемы, и исправить их. Работай по фазам строго последовательно. После каждой фазы выводи краткий отчёт найденных проблем.

---

## Фаза 1: Статический анализ

Запусти три команды и собери ВСЕ ошибки в единый список:

```bash
npm run build 2>&1
npm run lint 2>&1
npm run typecheck 2>&1
```

Для каждой ошибки зафиксируй: файл, строку, суть ошибки. Не исправляй пока — только собирай.

---

## Фаза 2: Аудит зависимостей

1. Запусти `npm audit` — зафиксируй уязвимости с severity high/critical.
2. Проверь warnings при `npm install` (deprecated пакеты, unknown config keys в .npmrc).
3. Проверь `package.json`:
   - Есть ли пакеты, которые установлены но нигде не импортируются? (используй `grep -r` по `node_modules/.package-lock.json` имена пакетов vs `src/`)
   - Есть ли дублирование функциональности (например, два HTTP-клиента, два роутера карт)?
4. Проверь совместимость версий: Next.js 15 + React 18 + текущие Radix UI пакеты.

Используй **Context7 MCP** (`resolve-library-id` → `query-docs`) чтобы проверить актуальные версии и breaking changes для ключевых зависимостей: `next`, `react`, `@vis.gl/react-google-maps`, `swiper`, `framer-motion`.

---

## Фаза 3: Runtime-проверка через Playwright

Запусти dev-сервер:
```bash
npm run dev &
```

Подожди пока сервер стартует, затем через **Playwright MCP** обойди ВСЕ страницы приложения:

**Публичные страницы:**
- `http://localhost:9002/`
- `http://localhost:9002/login`
- `http://localhost:9002/register`
- `http://localhost:9002/restaurants`
- `http://localhost:9002/search`
- `http://localhost:9002/category/test`
- `http://localhost:9002/stores/test`
- `http://localhost:9002/support`
- `http://localhost:9002/activate-code`
- `http://localhost:9002/invite`

**Защищённые страницы (проверь редирект на /login):**
- `http://localhost:9002/cart`
- `http://localhost:9002/checkout`
- `http://localhost:9002/orders`
- `http://localhost:9002/orders/history`
- `http://localhost:9002/profile`
- `http://localhost:9002/profile/edit`
- `http://localhost:9002/addresses`
- `http://localhost:9002/payment-methods`

На каждой странице:
1. `browser_navigate` → дождись загрузки
2. `browser_console_messages` → собери ошибки (errors и warnings)
3. `browser_network_requests` → зафиксируй 4xx/5xx ответы
4. `browser_take_screenshot` → если есть визуальные артефакты

Зафиксируй: гидратационные ошибки, unhandled promise rejections, missing images, failed API calls.

После проверки останови dev-сервер.

---

## Фаза 4: API и интеграции

1. Проверь что `.env.local` и `.env` содержат все необходимые переменные:
   - `API_BASE_URL` — должен быть задан
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — должен быть задан
   - `GOOGLE_GENAI_API_KEY` — нужен для Genkit
2. Проверь файлы интеграций на корректность:
   - `src/lib/api.ts` — все endpoint'ы формируют валидные URL?
   - `src/lib/auth-api.ts` — token refresh логика без race conditions?
   - `src/lib/auth-http-client.ts` — 401 handler не зацикливается?
   - `src/services/liqpay.ts`, `src/services/binance-pay.ts` — нет hardcoded credentials?
3. Проверь `next.config.js` на deprecated/invalid опции для текущей версии Next.js.

Используй **Context7 MCP** чтобы проверить актуальные config-опции Next.js 15.

---

## Фаза 5: Code quality

1. **Пустые/stub файлы**: найди файлы в `src/` которые пустые или содержат только placeholder-контент.
   ```
   find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -n | head -20
   ```

2. **Мёртвый код**: найди компоненты в `src/components/` которые нигде не импортируются.
   Для каждого файла в `src/components/**/*.tsx` проверь есть ли импорт этого компонента в других файлах.

3. **Незавершённая работа**: найди TODO, FIXME, HACK, XXX комментарии:
   ```
   grep -rn "TODO\|FIXME\|HACK\|XXX" src/
   ```

4. **Консистентность паттернов**:
   - Все страницы имеют `"use client"` директиву?
   - Все контексты следуют паттерну createContext → Provider → useHook?
   - Нет ли прямых fetch() вызовов в обход api.ts?

5. **TypeScript строгость**: есть ли `any` типы, `@ts-ignore`, `@ts-nocheck`?
   ```
   grep -rn "@ts-ignore\|@ts-nocheck\|: any\|as any" src/
   ```

---

## Фаза 6: Исправление

Теперь у тебя полный список проблем из фаз 1-5. Исправляй по приоритету:

### Приоритет 1 — Build blockers
Ошибки из `npm run build` которые ломают сборку. Исправь и проверь что build проходит.

### Приоритет 2 — TypeScript ошибки
Ошибки из `npm run typecheck`. При исправлении типов используй **Context7 MCP** чтобы проверить актуальные типы библиотек.

### Приоритет 3 — Runtime ошибки
Консольные ошибки и failed network requests из фазы 3. Гидратационные ошибки — в первую очередь.

### Приоритет 4 — Lint ошибки
Исправь ESLint warnings/errors.

### Приоритет 5 — Зависимости
- Deprecated пакеты — обнови если есть совместимая версия.
- High/critical уязвимости — `npm audit fix` где безопасно, ручное обновление где нужен major bump.
- Удали неиспользуемые зависимости из package.json.

### Приоритет 6 — Code quality
- Удали мёртвый код и пустые файлы.
- Исправь `any` типы на правильные.
- Удали `@ts-ignore` и исправь underlying проблемы.

**Правила исправления:**
- После КАЖДОГО фикса запускай `npm run build && npm run typecheck` чтобы убедиться что не сломал другое.
- Если ошибка непонятна — используй **Perplexity MCP** (`perplexity_ask`) для исследования.
- Если нужно проверить API библиотеки — используй **Context7 MCP** (`resolve-library-id` → `query-docs`).
- Если нужно проверить поведение в браузере после фикса — используй **Playwright MCP**.
- Делай атомарные изменения: один фикс — одна проверка. Не меняй 10 файлов без проверки.

---

## Финальная верификация

После всех исправлений запусти полную проверку:

```bash
npm run build && npm run lint && npm run typecheck
```

Все три команды должны пройти без ошибок.

Затем повтори runtime-проверку из Фазы 3 через Playwright — убедись что консольные ошибки устранены.

Выведи финальный отчёт:
```
## Результат аудита FoodWise

### Найдено проблем: X
### Исправлено: Y
### Не исправлено (требует ручного вмешательства): Z

### По фазам:
- Build: N ошибок → исправлено / осталось
- TypeScript: N ошибок → ...
- Runtime: N ошибок → ...
- Lint: N ошибок → ...
- Зависимости: N проблем → ...
- Code quality: N проблем → ...

### Что требует внимания разработчика:
- [список проблем которые не удалось исправить автоматически с объяснением почему]
```
