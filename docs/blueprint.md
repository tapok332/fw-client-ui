# **App Name**: FoodWise

## Core Features:

- Home Page: Implement a home page with a sticky header, hero carousel, category filters, and a display of 'Surprise Boxes' with relevant information.
- User Authentication: Enable user authentication with login and registration pages, including form validation and feedback messages.
- AI Description Generator: Provide a tool for merchants to generate descriptions for their 'Surprise Boxes' using AI.

## Style Guidelines:

- Use a light color theme with an auto-switch to dark mode.
- Employ 'Wise-Green' as the primary color for call-to-action elements.
- Use orange for discount tags to highlight savings.
- Implement an 8-pt grid system for consistent spacing.
- Design primary controls to be easily accessible within thumb's reach on mobile devices.
- Use bottom sheet modals for smaller screens.
- Incorporate skeleton loading for a fast user experience.

## Original User Request:
FoodWise Web App (MVP – 1 месяц)
Минималистичный, mobile-first PWA: лёгкая цветная тема + автопереключаемый dark-mode. Сетка 8 - pt, Inter, фирменный Wise-Green для CTA.

⸻

Страницы и ключевые детали
	1.	Home (/) – публичная витрина
• Sticky-header (лого + Login / аватар, “My Orders”).
• Hero-карусель (3 слайда «Save Food / Money / Planet», fade, auto-5 s).
• Horizontal chips-фильтр категорий (swipe).
• Лента “Surprise Boxes” (3-карточная сетка, BoxCard c фото 3:2, скидочный Tag, таймер).
• Пустые/ошибочные состояния: Ant Result 500, Empty simple.
• Перелистываемый футер © 2025.
	2.	Login (/login)
Карточка 360 px, поля Email + Password, zod-валидация, кнопка “Login” (Wise-Green). Toast-уведомления успех/ошибка. Ссылка “No account? Sign up”.
	3.	Register (/register)
Те же стили; поля Email / Password / Confirm + чекбокс согласия. Авто-login после успешного POST /auth/register. Доп-требования пароля (8 симв., заглавная, цифра).
	4.	Profile (/profile) – приватно
Аватар, e-mail, eco-статистика (“₴ saved / kg CO₂”). Кнопки “Edit”, “Logout”. Страница смены пароля доступна внутри.
	5.	Orders (/orders) – приватно
Таб Active | History. Active: карточка с таймером и QR-кодом, статус-трекер. History: collapsible, рейтинг звёздами.
	6.	Box Detail (/boxes/:id)
Карусель фото + инфо-стек (аллергены, рейтинг). Переключатель Pickup / Mock-Delivery, stepper количества, итоговая цена. CTA “Rescue for 99 ₴”.
	7.	Checkout (/checkout/:orderId)
Шаги 1-Info 2-Payment 3-Done. Способы: LiqPay (карта/Apple/Google Pay) и Binance Pay. Адрес-форма для доставки (если выбран Delivery). Успех → confetti + pickup-code, “Add to calendar”.
	8.	Merchant Dashboard (/merchant) – скрытое (только роль merchant)
Список заведений, кнопка “Add Box”, AI-генератор описания (“Auto-describe”).
	9.	Fallback 404 / Error
Ant Result 404 или 500, кнопка “Go Home”.

⸻

Интерфейсные принципы
	•	Быстрота — Vite + React 18, lazy-routes, skeleton loading.
	•	Доступность — Radix primitives, ARIA-метки, контраст AA.
	•	Навигация — React-Router 6, приватные маршруты RequireAuth, редирект next.
	•	Настроение — чистые белые площади, акцент-зеленый, оранжевые скидки, мягкие тени, кругляш-аватар.
	•	Мобильность — все primary-контролы в зоне большого пальца, sticky chips, bottom sheet-модалки (Radix Dialog) для мелких экранов.

Итог: компактное, понятное веб-приложение, в котором пользователь за 4 тапа спасает еду, а владелец заведения — выкладывает “сюрприз-коробку” за 2 минуты.
  