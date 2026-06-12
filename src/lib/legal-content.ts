// Long-form legal copy lives here (not in translations.ts) to keep the global
// translation map lean. Keyed by language with a uk fallback.

export type LegalSection = { heading: string; body: string[] };
export type LegalDoc = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
  contact: string;
};

export const privacyContent: Record<string, LegalDoc> = {
  uk: {
    title: "Політика конфіденційності",
    updated: "Оновлено: 28 травня 2026",
    intro:
      "FoodWise допомагає рятувати їжу — ми збираємо лише ті дані, які потрібні, щоб ви могли знаходити сюрприз-бокси поблизу, оформлювати замовлення та забирати їх. Ця сторінка пояснює, які дані ми використовуємо та навіщо.",
    sections: [
      {
        heading: "Які дані ми збираємо",
        body: [
          "Дані акаунта: імʼя, електронна пошта та номер телефону, які ви вказуєте під час реєстрації.",
          "Геолокація: приблизне місцезнаходження, щоб показувати заклади та бокси поблизу. Ви можете вимкнути це в налаштуваннях пристрою.",
          "Дані замовлень: що ви бронюєте, у якому закладі та час самовивозу.",
          "Платіжні дані обробляють платіжні сервіси (наприклад, картковий процесинг). Ми не зберігаємо повні реквізити картки.",
        ],
      },
      {
        heading: "Як ми використовуємо дані",
        body: [
          "Щоб показувати доступні бокси поблизу, оформлювати та підтверджувати замовлення й координувати самовивіз із закладом.",
          "Щоб надавати підтримку, попереджати про статус замовлення та покращувати сервіс.",
          "Ми не продаємо ваші персональні дані третім сторонам.",
        ],
      },
      {
        heading: "Кому ми передаємо дані",
        body: [
          "Закладу, у якому ви бронюєте бокс — щоб підготувати та видати замовлення.",
          "Платіжним та технічним постачальникам послуг, які допомагають працювати сервісу, виключно в обсязі, потрібному для надання послуги.",
        ],
      },
      {
        heading: "Зберігання та захист",
        body: [
          "Дані передаються захищеним зʼєднанням і зберігаються рівно стільки, скільки потрібно для надання сервісу та виконання юридичних вимог.",
        ],
      },
      {
        heading: "Ваші права",
        body: [
          "Ви можете запитати доступ до своїх даних, виправити їх, видалити акаунт або відкликати згоду на обробку. Напишіть нам — і ми допоможемо.",
        ],
      },
      {
        heading: "Файли cookie та локальне сховище",
        body: [
          "Ми використовуємо локальне сховище браузера, щоб памʼятати вашу мову, кошик і сесію. Це потрібно для роботи застосунку.",
        ],
      },
    ],
    contact:
      "Питання щодо конфіденційності? Напишіть на privacy@foodwise.example — ми відповімо.",
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: 28 May 2026",
    intro:
      "FoodWise helps rescue food. We collect only the data we need so you can find surprise boxes nearby, place orders and pick them up. This page explains what we use and why.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Account data: the name, email and phone number you provide at sign-up.",
          "Location: your approximate position, to show stores and boxes nearby. You can turn this off in your device settings.",
          "Order data: what you reserve, from which store, and the pickup window.",
          "Payment data is handled by payment providers (for example, card processors). We do not store full card details.",
        ],
      },
      {
        heading: "How we use it",
        body: [
          "To show available boxes nearby, place and confirm orders, and coordinate pickup with the store.",
          "To provide support, notify you about order status, and improve the service.",
          "We do not sell your personal data to third parties.",
        ],
      },
      {
        heading: "Who we share it with",
        body: [
          "The store where you reserve a box, so they can prepare and hand over your order.",
          "Payment and technical service providers that help run the service, only to the extent needed to provide it.",
        ],
      },
      {
        heading: "Storage and security",
        body: [
          "Data is transferred over a secure connection and kept only as long as needed to provide the service and meet legal requirements.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can request access to your data, correct it, delete your account, or withdraw consent. Reach out and we will help.",
        ],
      },
      {
        heading: "Cookies and local storage",
        body: [
          "We use browser local storage to remember your language, cart and session. This is required for the app to work.",
        ],
      },
    ],
    contact: "Privacy questions? Email privacy@foodwise.example and we will get back to you.",
  },
};

export const termsContent: Record<string, LegalDoc> = {
  uk: {
    title: "Умови використання",
    updated: "Оновлено: 28 травня 2026",
    intro:
      "Користуючись FoodWise, ви погоджуєтеся з цими умовами. FoodWise — це маркетплейс, що допомагає рятувати їжу: заклади продають сюрприз-бокси з нереалізованих, але якісних продуктів зі знижкою.",
    sections: [
      {
        heading: "Про сервіс",
        body: [
          "FoodWise зʼєднує вас із локальними закладами. Вміст сюрприз-боксів формує заклад і він може відрізнятися — це частина ідеї рятування їжі.",
        ],
      },
      {
        heading: "Акаунт",
        body: [
          "Ви відповідаєте за збереження доступу до свого акаунта та за дії, виконані через нього.",
        ],
      },
      {
        heading: "Замовлення та самовивіз",
        body: [
          "Замовлення потрібно забрати у вказаний час самовивозу в закладі. Кількість боксів обмежена та залежить від наявності.",
        ],
      },
      {
        heading: "Оплата та повернення",
        body: [
          "Оплата здійснюється під час оформлення замовлення через платіжні сервіси. Питання повернення коштів розглядаються індивідуально разом із закладом.",
        ],
      },
      {
        heading: "Якість та алергени",
        body: [
          "За приготування, склад і безпеку продуктів відповідає заклад. Якщо у вас є алергія, уточнюйте склад безпосередньо в закладі перед споживанням.",
        ],
      },
      {
        heading: "Зміни умов",
        body: [
          "Ми можемо оновлювати ці умови. Актуальна версія завжди доступна на цій сторінці.",
        ],
      },
    ],
    contact: "Питання щодо умов? Напишіть на support@foodwise.example.",
  },
  en: {
    title: "Terms of Service",
    updated: "Last updated: 28 May 2026",
    intro:
      "By using FoodWise you agree to these terms. FoodWise is a marketplace that helps rescue food: stores sell surprise boxes of unsold but good food at a discount.",
    sections: [
      {
        heading: "About the service",
        body: [
          "FoodWise connects you with local stores. The contents of a surprise box are decided by the store and may vary, that is part of the food-rescue idea.",
        ],
      },
      {
        heading: "Your account",
        body: [
          "You are responsible for keeping your account secure and for actions taken through it.",
        ],
      },
      {
        heading: "Orders and pickup",
        body: [
          "Orders must be collected during the stated pickup window at the store. The number of boxes is limited and depends on availability.",
        ],
      },
      {
        heading: "Payment and refunds",
        body: [
          "Payment is taken at checkout through payment providers. Refund requests are handled case by case together with the store.",
        ],
      },
      {
        heading: "Quality and allergens",
        body: [
          "The store is responsible for the preparation, contents and safety of the food. If you have allergies, confirm the contents with the store before eating.",
        ],
      },
      {
        heading: "Changes to these terms",
        body: [
          "We may update these terms. The current version is always available on this page.",
        ],
      },
    ],
    contact: "Questions about the terms? Email support@foodwise.example.",
  },
};
