// Define the supported languages
export type Language = 'uk' | 'en';

// Define the structure of our translations
export type TranslationKeys = {
    navigation: {
        recommendations: string;
        restaurants: string;
        stores: string;
        cart: string;
        profile: string;
        favorites: string;
    };
    error: {
        somethingWentWrong: string;
        pleaseTryAgain: string;
        refresh: string;
        serviceUnavailable: string;
        tryAgainLater: string;
        backToHome: string;
        serversTemporarilyUnavailable: string;
        unexpectedErrorOccurred: string;
        tryAgain: string;
    };
    common: {
        loading: string;
        error: string;
        success: string;
        or: string;
        all: string;
        search: string;
        timeLeft: string;
        rescue: string;
        exploreBoxes: string;
        copyright: string;
        backHome: string;
        uploading: string;
        saving: string;
        saved: string;
        back: string;
        loadMore: string;
        startExploring: string;
        exploreNow: string;
        kg: string;
        demoMode: string;
        retry: string;
        copy: string;
        share: string;
        copied: string;
        linkCopiedToClipboard: string;
        minutes: string;
        noResults: string;
        tryDifferentSearch: string;
        showAll: string;
        cancel: string;
        off: string;
        left: string;
        processing: string;
        refresh: string;
        addedToCart: string;
        addError: string;
        addToCart: string;
        adding: string;
        addingToCart: string;
        comingSoon: string;
        remove: string;
        delete: string;
        kmShort: string;
        storePhotoAlt: string;
        ratingLabel: string;
        required: string;
        maxLength: string;
        minLength: string;
        lettersOnly: string;
        postalCodeDigits: string;
        invalidChars: string;
    };
    restaurants: {
        searchPlaceholder: string;
        filters: string;
        minRating: string;
        maxDistance: string;
        openNow: string;
        resetFilters: string;
        hideMap: string;
        showMap: string;
        popularRestaurants: string;
        nearbyRestaurants: string;
        recommendedRestaurants: string;
        allRestaurants: string;
        allPopularRestaurants: string;
        loadMore: string;
        loadingMap: string;
        noPopularRestaurants: string;
        noNearbyRestaurants: string;
        noRecommendedRestaurants: string;
        noRestaurantsFound: string;
        noRestaurantsOnMap: string;
        waitingForLocation: string;
        mapPlaceholder: string;
        restaurantsMap: string;
    };
    store: {
        searchMenu: string;
        open: string;
        closed: string;
        minOrder: string;
        delivery: string;
        sellerInfo: string;
        sellerDetailsInfo: string;
        aboutSeller: string;
        shareText: string;
        recentlyBought: string;
        item: string;
        items: string;
        errorLoadingStore: string;
        errorAddingToCart: string;
        pickup: string;
        recommended: string;
        allAvailableBoxes: string;
        description: string;
        details: string;
        workingHours: string;
        address: string;
        noSurpriseBoxes: string;
        noSurpriseBoxesDescription: string;
    };
    auth: {
        login: string;
        loggingIn: string;
        register: string;
        logout: string;
        loginSuccess: string;
        logoutSuccess: string;
        logoutError: string;
        email: string;
        password: string;
        noAccount: string;
        emailPlaceholder: string;
        passwordPlaceholder: string;
        loginError: string;
        invalidCredentials: string;
        fieldRequired: string;
        heroTitle1: string;
        heroTitle2: string;
        heroSubtitle: string;
        step1Title: string;
        step1Desc: string;
        step2Title: string;
        step2Desc: string;
        step3Title: string;
        step3Desc: string;
        passwordsDontMatch: string;
        passwordRequirements: string;
        passwordMinLength: string;
        registrationError: string;
        registrationFailed: string;
        passwordTooWeak: string;
        passwordWeak: string;
        passwordFair: string;
        passwordGood: string;
        passwordStrong: string;
        passwordVeryStrong: string;
        passwordStrength: string;
        atLeast8Chars: string;
        uppercase: string;
        lowercase: string;
        number: string;
        specialChar: string;
        confirmPassword: string;
        showPassword: string;
        hidePassword: string;
        optional: string;
        passwordRule8Chars: string;
        passwordRuleUppercase: string;
        passwordRuleNumber: string;
        passwordRuleSpecial: string;
        passwordMedium: string;
        googleSignInNotConfigured: string;
        googleSignInLoading: string;
    };
    app: {
        appName: string;
        slogan: string;
    };
    buttons: {
        signInWithGoogle: string;
        signInWithTelegram: string;
    };
    home: {
        searchPlaceholder: string;
        saveFood: string;
        saveMoney: string;
        savePlanet: string;
        lateLunch: string;
        heroEyebrow: string;
        heroBadge: string;
        promotionalCarousel: string;
        noResultsInCategory: string;
        noResultsForSearch: string;
        noBoxesAvailable: string;
        featuredStores: string;
        noFeaturedStores: string;
        nearbyStores: string;
        nearbyStoresMap: string;
        mapOfNearbyStores: string;
        loadingLocation: string;
        yourLocation: string;
        noNearbyStores: string;
        stores: string;
        noStoresInCategory: string;
        storeSearchResults: string;
        noStoreSearchResults: string;
    };
    categories: {
        bakery: string;
        cafe: string;
        restaurant: string;
        grocery: string;
        sweets: string;
        other: string;
        categoryItems: string;
        loadingMore: string;
        loadMore: string;
        noItemsFound: string;
        resetFilters: string;
        noItemsOnMap: string;
        waitingForLocation: string;
        filters: string;
        itemsMap: string;
        minRating: string;
        maxDistance: string;
        openNow: string;
        priceLevel: string;
        sortBy: string;
        selectSortOption: string;
        byRating: string;
        byDistance: string;
        byPriceAsc: string;
        byPriceDesc: string;
    };
    map: {
        searchForPickups: string;
        panToCurrentLocation: string;
        geolocationFailed: string;
        browserDoesntSupportGeolocation: string;
        viewDetails: string;
        yourLocation: string;
    };
    profile: {
        myProfile: string;
        personalData: string;
        statistics: string;
        ordersHistory: string;
        name: string;
        yourName: string;
        address: string;
        yourAddress: string;
        preferences: string;
        yourPreferencesPlaceholder: string;
        emailCannotBeChanged: string;
        saveChanges: string;
        profileUpdated: string;
        yourDataSuccessfullySaved: string;
        errorLoadingProfile: string;
        updateProfileError: string;
        failedToUpdateProfile: string;
        reloadPageToRetry: string;
        ordersCompleted: string;
        itemsSaved: string;
        savings: string;
        saved: string;
        noOrders: string;
        order: string;
        store: string;
        total: string;
        pickupCode: string;
        orderDetails: string;
        inviteFriends: string;
        activateCode: string;
        support: string;
        settings: string;
        paymentMethods: string;
        addresses: string;
        // Payment methods page
        makeDefault: string;
        addPaymentMethod: string;
        defaultPayment: string;
        cardDetails: string;
        expires: string;
        securePayment: string;
        // Address page
        addAddress: string;
        defaultAddress: string;
        // Invite friends
        yourReferralCode: string;
        shareWithFriends: string;
        invitedFriends: string;
        earnRewards: string;
        shareYourInvite: string;
        howItWorks: string;
        shareCode: string;
        friendSignsUp: string;
        theyGetDiscount: string;
        youGetCredit: string;
        // Activate code
        promoCode: string;
        enterPromoCode: string;
        activateButton: string;
        activating: string;
        popularCodes: string;
        pleaseEnterCode: string;
        codeActivated: string;
        invalidCode: string;
        welcomeBonus: string;
        summerDiscount: string;
        demoHint: string;
        // Support
        contactSupport: string;
        howCanWeHelp: string;
        sendMessage: string;
        sending: string;
        faq: string;
        needHelp: string;
        callUs: string;
        workingHours: string;
        // Order details
        orderInformation: string;
        orderDate: string;
        orderTime: string;
        orderStatus: string;
        storeInformation: string;
        contactStore: string;
        getDirections: string;
        orderItems: string;
        cancelOrder: string;
        helpWithOrder: string;
        // Order statuses
        pending: string;
        confirmed: string;
        ready: string;
        completed: string;
        cancelled: string;
        unknownStatus: string;
        // Profile page specific
        profileNotFound: string;
        hi: string;
        totalSaved: string;
        orderAgain: string;
        popularLinks: string;
        personalInfo: string;
        photoUpdated: string;
        cards: string;
        orders: string;
        processing: string;
    };
    merchant: {
        merchantDashboard: string;
        activeBoxes: string;
        ordersToday: string;
        revenue: string;
        createBox: string;
        viewOrders: string;
        viewAnalytics: string;
        gettingStarted: string;
        welcomeMessage: string;
        step1Title: string;
        step1Description: string;
        step2Title: string;
        step2Description: string;
        step3Title: string;
        step3Description: string;
        createFirstBox: string;
    };
    orders: {
        yourOrders: string;
        noOrdersYet: string;
        ordersWillAppearHere: string;
        checkout: string;
        customerDetails: string;
        paymentMethod: string;
        orderSummary: string;
        confirmOrder: string;
        PROCESSING: string;
        processing: string;
        pickupAtStore: string;
        payAtPickup: string;
        paymentOnCollection: string;
        checkoutDisclaimer: string;
        errorLoadingOrders: string;
        orderStatus: string;
        total: string;
        orderDetails: string;
        orderNotFound: string;
        orderNotFoundDesc: string;
        orderAgain: string;
        backToHistory: string;
        storeInfo: string;
        storeInformation: string;
        viewStore: string;
        showCodeToPickUp: string;
        codeCopied: string;
        codeReadyToUse: string;
        orderedOn: string;
        yourImpact: string;
        moneySaved: string;
        co2Saved: string;
        orderCancelled: string;
        orderCancelledSuccess: string;
        errorCancellingOrder: string;
        errorLoadingOrderDetails: string;
        quantity: string;
        needHelp: string;
        contactSupport: string;
        cancelOrder: string;
        orderNumber: string;
        orderItems: string;
        orderDate: string;
        orderTime: string;
        pickupCode: string;
        orderInformation: string;
        tooManyAttempts: string;
        reloadPageToRetry: string;
    };
    support: {
        errorSendingMessage: string;
        reloadPageToRetry: string;
        describeIssue: string;
        subject: string;
        message: string;
        pleaseEnterMessage: string;
        messageSent: string;
        faqHowItWorks: string;
        faqHowItWorksAnswer: string;
        faqCanCancel: string;
        faqCanCancelAnswer: string;
        faqMissPickup: string;
        faqMissPickupAnswer: string;
        callUsAt: string;
    };
    checkout: {
        onlinePayment: string;
        cashPayment: string;
        paymentFormNotReady: string;
        verifyCardDetails: string;
        paymentFailed: string;
        stripeProtected: string;
        onlinePaymentUnavailable: string;
        preparingPayment: string;
        processingPayment: string;
        bankConfirmation: string;
        ready: string;
        paymentSuccess: string;
        paymentDidNotGoThrough: string;
        tryAgain: string;
        fillRequiredFields: string;
        waitForAddressesLoading: string;
        failedToSaveAddress: string;
        ecoImpact: string;
        confirmingOrder: string;
        creatingOrder: string;
        orByCard: string;
        stripeProtectedShort: string;
        stripeNotConfigured: string;
        waitingForAmount: string;
        title: string;
        deliveryMethod: string;
        deliveryMethodDescription: string;
        pickupAtStore: string;
        free: string;
        courierDelivery: string;
        deliveryByRates: string;
        deliveryAddress: string;
        clickToChange: string;
        noSavedAddresses: string;
        editAddressAria: string;
        addNewAddress: string;
        enterNewAddress: string;
        editAddress: string;
        newAddressTitle: string;
        addressLabelRequired: string;
        addressLabelPlaceholder: string;
        streetRequired: string;
        streetPlaceholderExample: string;
        cityRequired: string;
        cityPlaceholderExample: string;
        regionLabel: string;
        regionPlaceholderExample: string;
        postalCodeRequired: string;
        countryRequired: string;
        countryPlaceholderExample: string;
        addressType: string;
        addressTypeHome: string;
        addressTypeWork: string;
        addressTypeOther: string;
        setAsDefault: string;
        addressPreview: string;
        savingProgress: string;
        saveChanges: string;
        saveAddress: string;
        cancelEdit: string;
        itemsCount: string;
        paymentMethod: string;
        paymentMethodDescription: string;
        cashOnlyForPickup: string;
        payOnReceipt: string;
        payOnReceiptDescription: string;
        promoCode: string;
        enterPromoCode: string;
        apply: string;
        applyShort: string;
        pickupFree: string;
        delivery: string;
        addressLabel: string;
        total: string;
        iAccept: string;
        termsOfService: string;
        and: string;
        privacyPolicy: string;
        protectedPayment: string;
        payButton: string;
        confirmOrder: string;
        provideDeliveryAddress: string;
        addDeliveryAddress: string;
        selectDeliveryAddress: string;
        geolocationFailedFallback: string;
        geolocationNotSupportedShort: string;
        failedToCreateOrder: string;
        paymentSessionNoSecret: string;
        serverCommunicationError: string;
        paymentNotConfirmed: string;
        unknownError: string;
        failedToSaveAddressRetry: string;
    };
    cart: {
        title: string;
        emptyCart: string;
        addItemsDescription: string;
        viewOffers: string;
        clearCart: string;
        confirmClearCart: string;
        proceedToCheckout: string;
        items: string;
        orderInfo: string;
        savingThePlanet: string;
        loginRequired: string;
        loginAndCheckout: string;
        termsAgreement: string;
        decreaseQuantity: string;
        increaseQuantity: string;
        removeItem: string;
        showRemoveOptions: string;
        cancelRemove: string;
        totalForItems: string;
        itemOne: string;
        itemFew: string;
        itemMany: string;
    };
    search: {
        title: string;
        inDevelopment: string;
        placeholder: string;
    };
    invite: {
        title: string;
        shareTitle: string;
        shareText: string;
        referralCopied: string;
        copyFailed: string;
        sharingNotSupported: string;
    };
    orderStatus: {
        pending: string;
        confirmed: string;
        processing: string;
        ready: string;
        completed: string;
        cancelled: string;
        unknown: string;
    };
    payment: {
        visa: string;
        mastercard: string;
        expires: string;
        makeDefault: string;
        default: string;
        defaultUpdated: string;
        cannotRemoveDefault: string;
        paymentMethodRemoved: string;
        addPaymentMethod: string;
        paymentInformation: string;
        secureProcessing: string;
        multiplePaymentMethods: string;
        defaultPaymentMethod: string;
        demoDescription: string;
    };
    confirmation: {
        orderPlaced: string;
        success: string;
        thankYou: string;
        orderConfirmed: string;
        orderNumber: string;
        ecoImpact: string;
        co2Saved: string;
        mealsSaved: string;
        moneySaved: string;
        thankYouEco: string;
        orderStatus: string;
        statusPending: string;
        statusProcessing: string;
        statusReady: string;
        statusCompleted: string;
        statusCancelled: string;
        processingDescription: string;
        readyPickup: string;
        readyDelivery: string;
        completedPickup: string;
        completedDelivery: string;
        items: string;
        orderInfo: string;
        pickup: string;
        delivery: string;
        expressDelivery: string;
        cardPayment: string;
        cashPayment: string;
        onlinePayment: string;
        payment: string;
        paid: string;
        payOnReceive: string;
        pickupCode: string;
        estimatedReady: string;
        estimatedDelivery: string;
        storeAddress: string;
        noAddress: string;
        courierDelivery: string;
        subtotal: string;
        deliveryFee: string;
        free: string;
        serviceRates: string;
        total: string;
        thankYouPlanet: string;
        backToHome: string;
        myOrders: string;
        loading: string;
        loadError: string;
        toHome: string;
        noOrderId: string;
    };
    address: {
        default: string;
        makeDefault: string;
        defaultUpdated: string;
        cannotRemoveDefault: string;
        addressRemoved: string;
        addNewAddress: string;
        yourAddresses: string;
        addressInformation: string;
        defaultAddressCheckout: string;
        multipleAddresses: string;
        accurateInformation: string;
        home: string;
        work: string;
        other: string;
        demoDescription: string;
        getDirections: string;
        loadingError: string;
        // Address form fields
        addressTitle: string;
        titlePlaceholder: string;
        addressType: string;
        selectAddressType: string;
        fullAddress: string;
        fullAddressPlaceholder: string;
        street: string;
        streetPlaceholder: string;
        city: string;
        cityPlaceholder: string;
        state: string;
        statePlaceholder: string;
        postalCode: string;
        postalCodePlaceholder: string;
        country: string;
        countryPlaceholder: string;
        saveAddress: string;
        saveChanges: string;
        editAddress: string;
        setAsDefault: string;
        addressPreview: string;
        // Address management messages
        addressAdded: string;
        failedToAdd: string;
        failedToLoad: string;
        failedToUpdate: string;
        failedToRemove: string;
        noAddresses: string;
    };
    storeTypes: {
        RESTAURANT: string;
        CAFE: string;
        BAKERY: string;
        GROCERY: string;
        SWEETS: string;
        OTHER: string;
    };
    storeGroups: {
        FOOD_SERVICE: string;
        RETAIL: string;
    };
    favorites: {
        title: string;
        count: string;
        emptyTitle: string;
        emptyDescription: string;
        browseCta: string;
        storeUnavailable: string;
        addedToast: string;
        removedToast: string;
        errorToast: string;
        addAriaLabel: string;
        removeAriaLabel: string;
    };
};

// Define the Ukrainian translations
export const ukTranslations: TranslationKeys = {
    navigation: {
        recommendations: 'Рекомендації',
        restaurants: 'Ресторани',
        stores: 'Магазини',
        cart: 'Кошик',
        profile: 'Профіль',
        favorites: 'Обране',
    },
    error: {
        somethingWentWrong: 'Щось пішло не так',
        pleaseTryAgain: 'Будь ласка, спробуйте ще раз',
        refresh: 'Оновити',
        serviceUnavailable: 'Сервіс недоступний',
        tryAgainLater: 'Наші сервери мають проблеми. Будь ласка, спробуйте пізніше.',
        backToHome: 'На головну',
        serversTemporarilyUnavailable: 'Наші сервери тимчасово недоступні. Ми працюємо над відновленням сервісу якомога швидше.',
        unexpectedErrorOccurred: 'Сталася неочікувана помилка. Будь ласка, спробуйте ще раз.',
        tryAgain: 'Спробувати знову'
    },
    restaurants: {
        searchPlaceholder: 'Пошук ресторану або локації',
        filters: 'Фільтри',
        minRating: 'Мінімальний рейтинг',
        maxDistance: 'Максимальна відстань',
        openNow: 'Відкрити зараз',
        resetFilters: 'Скинути фільтри',
        hideMap: 'Сховати карту',
        showMap: 'Показати карту',
        popularRestaurants: 'Популярні ресторани',
        nearbyRestaurants: 'Поблизу вас',
        recommendedRestaurants: 'Рекомендовані',
        allRestaurants: 'Всі ресторани',
        loadMore: 'Завантажити ще',
        noPopularRestaurants: 'Немає популярних ресторанів',
        noNearbyRestaurants: 'Поблизу немає ресторанів',
        noRecommendedRestaurants: 'Немає рекомендованих ресторанів',
        noRestaurantsFound: 'Нічого не знайдено, спробуйте змінити фільтри',
        mapPlaceholder: 'Карта ресторанів буде тут',
        allPopularRestaurants: 'Всі популярні ресторани',
        loadingMap: 'Завантаження карти...',
        noRestaurantsOnMap: 'На карті немає ресторанів',
        waitingForLocation: 'Очікування визначення місцезнаходження...',
        restaurantsMap: 'Карта ресторанів',
    },
    common: {
        loading: 'Завантаження...',
        error: 'Помилка',
        success: 'Успішно',
        or: 'або',
        all: 'Всі',
        search: 'Пошук',
        timeLeft: 'Залишилось часу',
        rescue: 'Врятувати',
        exploreBoxes: 'Переглянути заклади',
        copyright: '© 2025 FoodWise',
        backHome: 'На головну',
        uploading: 'Завантаження...',
        saving: 'Зберігання...',
        saved: 'Збережено',
        back: 'Назад',
        loadMore: 'Завантажити ще',
        startExploring: 'Почніть досліджувати доступні пропозиції',
        exploreNow: 'Переглянути зараз',
        kg: 'кг',
        demoMode: 'Демо режим',
        retry: 'Повторити',
        copy: 'Копіювати',
        share: 'Поділитись',
        addedToCart: 'Додано до кошика',
        addError: 'Не вдалося додати — спробуйте ще раз',
        addToCart: 'Додати до кошика',
        adding: 'Додавання...',
        addingToCart: 'Додавання в кошик...',
        comingSoon: 'Скоро буде',
        remove: 'Видалити',
        delete: 'Видалити',
        kmShort: 'км',
        storePhotoAlt: 'Фото закладу',
        ratingLabel: 'Рейтинг',
        required: 'Обовʼязкове поле',
        maxLength: 'Максимум {n} символів',
        minLength: 'Мінімум {n} символів',
        lettersOnly: 'Лише літери, пробіли та дефіси',
        postalCodeDigits: 'Індекс — лише цифри (4–10)',
        invalidChars: 'Містить недопустимі символи',
        copied: 'Скопійовано',
        linkCopiedToClipboard: 'Посилання скопійоване в буфер обміну',
        minutes: 'хв',
        noResults: 'Нічого не знайдено',
        tryDifferentSearch: 'Спробуйте інший запит',
        showAll: 'Показати всі',
        cancel: 'Скасувати',
        off: 'знижка',
        left: 'залишилось',
        processing: 'Обробка...',
        refresh: 'Оновити',
    },
    store: {
        searchMenu: 'Пошук в меню...',
        open: 'Відчинено',
        closed: 'Зачинено',
        minOrder: 'Мін. замовлення',
        delivery: 'Доставка',
        sellerInfo: 'Інформація про продавця',
        sellerDetailsInfo: 'Детальна інформація про продавця',
        aboutSeller: 'Про продавця',
        shareText: 'Перегляньте ${name} на нашому сайті!',
        recentlyBought: 'Недавно куплені',
        item: 'товар',
        items: 'товари',
        errorLoadingStore: 'Помилка завантаження магазину',
        errorAddingToCart: 'Помилка додавання до кошика',
        pickup: 'Самовивіз',
        recommended: 'Рекомендовані',
        allAvailableBoxes: 'Всі доступні бокси',
        description: 'Опис',
        details: 'Деталі',
        workingHours: 'Графік роботи',
        address: 'Адреса',
        noSurpriseBoxes: 'Немає доступних боксів',
        noSurpriseBoxesDescription: 'Зараз немає доступних боксів у цьому магазині',
    },
    auth: {
        login: 'Увійти',
        loggingIn: 'Вхід...',
        register: 'Зареєструватися',
        logout: 'Вийти',
        loginSuccess: 'Ви увійшли в систему',
        logoutSuccess: 'Ви успішно вийшли з свого облікового запису',
        logoutError: 'Помилка виходу',
        email: 'Email',
        password: 'Пароль',
        noAccount: 'Немає облікового запису?',
        emailPlaceholder: 'example@email.com',
        passwordPlaceholder: '••••••••',
        loginError: 'Помилка входу',
        invalidCredentials: 'Невірні облікові дані',
        fieldRequired: 'Будь ласка, заповніть усі поля',
        heroTitle1: 'Рятуйте їжу,',
        heroTitle2: 'економте гроші',
        heroSubtitle: 'Приєднуйтесь до спільноти свідомих споживачів, які рятують їжу від утилізації та роблять планету кращою.',
        step1Title: 'Обирайте',
        step1Desc: 'Знаходьте сюрприз-бокси поблизу зі знижкою 30-70%',
        step2Title: 'Забирайте',
        step2Desc: 'Заберіть замовлення з ресторану чи магазину',
        step3Title: 'Рятуйте',
        step3Desc: 'Їжа не потрапляє на смітник, а планета дякує',
        passwordsDontMatch: 'Паролі не співпадають',
        passwordRequirements: 'Вимоги до паролю:',
        passwordMinLength: 'Пароль повинен містити мінімум 8 символів, велику літеру, цифру та спеціальний символ',
        registrationError: 'Помилка реєстрації',
        registrationFailed: 'Не вдалося зареєструватися',
        passwordTooWeak: 'Дуже слабкий',
        passwordWeak: 'Слабкий',
        passwordFair: 'Прийнятний',
        passwordGood: 'Хороший',
        passwordStrong: 'Надійний',
        passwordVeryStrong: 'Дуже надійний',
        passwordStrength: 'Надійність паролю',
        atLeast8Chars: 'Не менше 8 символів',
        uppercase: 'Велику літеру (A-Z)',
        lowercase: 'Малу літеру (a-z)',
        number: 'Цифру (0-9)',
        specialChar: 'Спеціальний символ (!@#$...)',
        confirmPassword: 'Підтвердіть пароль',
        showPassword: 'Показати пароль',
        hidePassword: 'Сховати пароль',
        optional: 'необов\'язково',
        passwordRule8Chars: 'Мінімум 8 символів',
        passwordRuleUppercase: 'Мінімум 1 велику літеру',
        passwordRuleNumber: 'Мінімум 1 цифру',
        passwordRuleSpecial: 'Мінімум 1 спеціальний символ (!@#$%^&*)',
        passwordMedium: 'Середній',
        googleSignInNotConfigured: 'Google Sign-In не налаштовано (NEXT_PUBLIC_GOOGLE_CLIENT_ID відсутній)',
        googleSignInLoading: 'Google Sign-In ще завантажується, спробуйте ще раз',
    },
    app: {
        appName: 'FoodWise',
        slogan: 'Рятуйте їжу, економте гроші',
    },
    buttons: {
        signInWithGoogle: 'Увійти через Google',
        signInWithTelegram: 'Увійти через Telegram',
    },
    home: {
        searchPlaceholder: 'Шукати бокси або локації',
        saveFood: 'Рятуйте їжу',
        saveMoney: 'Економте гроші',
        savePlanet: 'Рятуйте планету',
        lateLunch: 'Пізній обід неподалеку',
        heroEyebrow: 'Сюрприз-бокси поблизу',
        heroBadge: 'Сьогодні · до -70%',
        promotionalCarousel: 'Рекламна карусель',
        noResultsInCategory: 'Немає боксів у цій категорії',
        noResultsForSearch: 'Немає боксів за вашим запитом',
        noBoxesAvailable: 'Зараз немає доступних боксів',
        featuredStores: 'Популярні заклади',
        noFeaturedStores: 'Немає популярних закладів',
        nearbyStores: 'Заклади поблизу',
        nearbyStoresMap: 'Карта магазинів поблизу',
        mapOfNearbyStores: 'Карта магазинів поблизу',
        loadingLocation: 'Визначення місцезнаходження...',
        yourLocation: 'Ваше місцезнаходження',
        noNearbyStores: 'Немає закладів поблизу',
        stores: 'Заклади',
        noStoresInCategory: 'Немає закладів у цій категорії',
        storeSearchResults: 'Результати пошуку закладів',
        noStoreSearchResults: 'Немає закладів за вашим запитом',
    },
    categories: {
        bakery: 'Пекарня',
        cafe: 'Кафе',
        restaurant: 'Ресторан',
        grocery: 'Продукти',
        sweets: 'Солодощі',
        other: 'Інше',
        categoryItems: 'Товари категорії',
        loadingMore: 'Завантаження...',
        loadMore: 'Завантажити ще',
        noItemsFound: 'Нічого не знайдено',
        resetFilters: 'Скинути фільтри',
        noItemsOnMap: 'На карті немає товарів',
        waitingForLocation: 'Очікування визначення місцезнаходження...',
        filters: 'Фільтри',
        itemsMap: 'Карта товарів',
        minRating: 'Мінімальний рейтинг',
        maxDistance: 'Максимальна відстань',
        openNow: 'Відкрито зараз',
        priceLevel: 'Рівень цін',
        sortBy: 'Сортувати за',
        selectSortOption: 'Оберіть варіант сортування',
        byRating: 'За рейтингом',
        byDistance: 'За відстанню',
        byPriceAsc: 'За ціною (зростання)',
        byPriceDesc: 'За ціною (спадання)',
    },
    map: {
        searchForPickups: 'Пошук точок видачі...',
        panToCurrentLocation: 'Перейти до поточного місцезнаходження',
        geolocationFailed: 'Помилка: Сервіс геолокації не працює.',
        browserDoesntSupportGeolocation: 'Помилка: Ваш браузер не підтримує геолокацію.',
        viewDetails: 'Переглянути деталі',
        yourLocation: 'Ваше місцезнаходження',
    },
    profile: {
        myProfile: 'Мій профіль',
        personalData: 'Особисті дані',
        statistics: 'Статистика',
        ordersHistory: 'Історія замовлень',
        name: 'Ім\'я',
        yourName: 'Ваше ім\'я',
        address: 'Адреса',
        yourAddress: 'Ваша адреса',
        preferences: 'Налаштування',
        yourPreferencesPlaceholder: 'Ваші налаштування',
        emailCannotBeChanged: 'Email не можна змінити',
        saveChanges: 'Зберегти зміни',
        profileUpdated: 'Профіль оновлено',
        yourDataSuccessfullySaved: 'Ваші дані успішно збережені',
        errorLoadingProfile: 'Не вдалося завантажити дані профілю',
        updateProfileError: 'Помилка оновлення профілю',
        failedToUpdateProfile: 'Не вдалося оновити профіль',
        reloadPageToRetry: 'Будь ласка, перезавантажте сторінку, щоб спробувати знову',
        ordersCompleted: 'Замовлень виконано',
        itemsSaved: 'Товарів врятовано',
        savings: 'Економія',
        saved: 'врятовано',
        noOrders: 'У вас поки немає замовлень',
        order: 'Замовлення',
        store: 'Магазин',
        total: 'Всього',
        pickupCode: 'Код отримання',
        orderDetails: 'Деталі замовлення',
        inviteFriends: 'Запросити друзів',
        activateCode: 'Активувати код',
        orderAgain: 'Замовити знову',
        support: 'Підтримка',
        settings: 'Налаштування',
        paymentMethods: 'Способи оплати',
        addresses: 'Адреси',
        profileNotFound: 'Профіль не знайдено',
        hi: 'Привіт',
        totalSaved: 'Всього заощаджено',
        popularLinks: 'Популярні посилання',
        personalInfo: 'Особиста інформація',
        photoUpdated: 'Фото оновлено',
        cards: 'карт(и)',
        orders: 'замовлень',
        // Payment methods page
        makeDefault: 'Зробити основним',
        addPaymentMethod: 'Додати спосіб оплати',
        defaultPayment: 'Основний',
        cardDetails: 'Деталі картки',
        expires: 'Закінчується',
        securePayment: 'Ми використовуємо безпечну обробку платежів і ніколи не зберігаємо повні дані карти.',
        // Address page
        addAddress: 'Додати адресу',
        defaultAddress: 'Основна адреса',
        // Invite friends
        yourReferralCode: 'Ваш реферальний код',
        shareWithFriends: 'Поділіться кодом з друзями і отримайте знижку',
        invitedFriends: 'Ви запросили 0 друзів',
        earnRewards: 'Заробіть до 2000₴ бонусів!',
        shareYourInvite: 'Поділитися запрошенням',
        howItWorks: 'Як це працює',
        shareCode: 'Поділіться своїм унікальним кодом з друзями',
        friendSignsUp: 'Ваш друг реєструється з вашим кодом',
        theyGetDiscount: 'Вони отримують 200₴ знижки на перше замовлення',
        youGetCredit: 'Ви отримуєте 200₴ на ваш рахунок, коли вони виконають перше замовлення',
        // Activate code
        promoCode: 'Промо-код',
        enterPromoCode: 'Введіть промо-код',
        activateButton: 'Активувати код',
        activating: 'Активація...',
        popularCodes: 'Популярні промо-коди:',
        pleaseEnterCode: 'Будь ласка, введіть код',
        codeActivated: 'Код успішно активовано! Ви отримали 200₴ на рахунок',
        invalidCode: 'Невірний або прострочений код',
        welcomeBonus: '200₴ знижки на перше замовлення',
        summerDiscount: '10% знижки на всі літні бокси',
        demoHint: '*Введіть \'WELCOME50\' для перегляду демо успішної активації',
        // Support
        contactSupport: 'Зв\'язатися з підтримкою',
        howCanWeHelp: 'Чим ми можемо допомогти?',
        sendMessage: 'Надіслати повідомлення',
        sending: 'Надсилання...',
        faq: 'Часті запитання',
        needHelp: 'Потрібна негайна допомога?',
        callUs: 'Телефонуйте нам за номером:',
        workingHours: 'Доступно 9:00 - 18:00, Понеділок - П\'ятниця',
        // Order details
        orderInformation: 'Інформація про замовлення',
        orderDate: 'Дата замовлення',
        orderTime: 'Час замовлення',
        orderStatus: 'Статус замовлення',
        storeInformation: 'Інформація про магазин',
        contactStore: 'Зв\'язатися з магазином',
        getDirections: 'Отримати маршрут',
        orderItems: 'Товари в замовленні',
        cancelOrder: 'Скасувати замовлення',
        helpWithOrder: 'Потрібна допомога з цим замовленням?',
        // Order statuses
        pending: 'Очікує підтвердження',
        confirmed: 'Підтверджено',
        processing: 'В обробці',
        ready: 'Готово до видачі',
        completed: 'Виконано',
        cancelled: 'Скасовано',
        unknownStatus: 'Невідомий статус',
    },
    merchant: {
        merchantDashboard: 'Панель продавця',
        activeBoxes: 'Активні коробки',
        ordersToday: 'Замовлення сьогодні',
        revenue: 'Дохід',
        createBox: 'Створити коробку',
        viewOrders: 'Переглянути замовлення',
        viewAnalytics: 'Переглянути аналітику',
        gettingStarted: 'Початок роботи',
        welcomeMessage: 'Ласкаво просимо до вашої панелі продавця! Почніть рятувати їжу та збільшуйте свій дохід.',
        step1Title: 'Створіть свою першу коробку',
        step1Description: 'Додайте опис, фото та встановіть знижку для вашої коробки.',
        step2Title: 'Керуйте доступністю',
        step2Description: 'Встановіть години, коли покупці можуть забрати свої замовлення.',
        step3Title: 'Отримуйте замовлення',
        step3Description: 'Перевіряйте нові замовлення та підготуйте коробки для видачі.',
        createFirstBox: 'Створити першу коробку',
    },
    orderStatus: {
        pending: 'Очікує підтвердження',
        confirmed: 'Підтверджено',
        processing: 'Готується',
        ready: 'Готово до видачі',
        completed: 'Виконано',
        cancelled: 'Скасовано',
        unknown: 'Невідомий статус',
    },
    payment: {
        visa: 'Visa',
        mastercard: 'Mastercard',
        expires: 'Діє до',
        makeDefault: 'Зробити основним',
        default: 'Основний',
        defaultUpdated: 'Основний спосіб оплати оновлено',
        cannotRemoveDefault: 'Неможливо видалити основний спосіб оплати',
        paymentMethodRemoved: 'Спосіб оплати видалено',
        addPaymentMethod: 'Додати спосіб оплати',
        paymentInformation: 'Інформація про оплату',
        secureProcessing: 'Ми використовуємо безпечну обробку платежів',
        multiplePaymentMethods: 'Додавайте кілька способів оплати для зручності',
        defaultPaymentMethod: 'Основний спосіб оплати використовується за замовчуванням',
        demoDescription: 'В демо-режимі додавання нових способів оплати недоступне',
    },
    address: {
        default: 'Основна',
        makeDefault: 'Зробити основною',
        defaultUpdated: 'Основну адресу оновлено',
        cannotRemoveDefault: 'Неможливо видалити основну адресу',
        addressRemoved: 'Адресу видалено',
        addNewAddress: 'Додати нову адресу',
        yourAddresses: 'Ваші адреси',
        addressInformation: 'Інформація про адреси',
        defaultAddressCheckout: 'Основна адреса використовується при оформленні замовлення',
        multipleAddresses: 'Додавайте кілька адрес для різних цілей',
        accurateInformation: 'Вказуйте точну інформацію для уникнення проблем з доставкою',
        home: 'Дім',
        work: 'Робота',
        other: 'Інше',
        demoDescription: 'В демо-режимі додавання нових адрес недоступне',
        getDirections: 'Прокласти маршрут',
        loadingError: 'Виникла проблема при завантаженні ваших адрес',
        // Address form fields
        addressTitle: 'Назва адреси',
        titlePlaceholder: 'Наприклад: Дім, Робота, Дача',
        addressType: 'Тип адреси',
        selectAddressType: 'Оберіть тип адреси',
        fullAddress: 'Повна адреса',
        fullAddressPlaceholder: 'Вул. Хрещатик, 1, Київ, Україна',
        street: 'Вулиця',
        streetPlaceholder: 'Вул. Хрещатик, 1',
        city: 'Місто',
        cityPlaceholder: 'Київ',
        state: 'Область',
        statePlaceholder: 'Київська',
        postalCode: 'Поштовий індекс',
        postalCodePlaceholder: '01001',
        country: 'Країна',
        countryPlaceholder: 'Україна',
        saveAddress: 'Зберегти адресу',
        saveChanges: 'Зберегти зміни',
        editAddress: 'Редагувати адресу',
        setAsDefault: 'Встановити як адресу за замовчуванням',
        addressPreview: 'Попередній перегляд адреси:',
        // Address management messages
        addressAdded: 'Адресу успішно додано',
        failedToAdd: 'Не вдалося додати адресу',
        failedToLoad: 'Не вдалося завантажити адреси',
        failedToUpdate: 'Не вдалося оновити адресу',
        failedToRemove: 'Не вдалося видалити адресу',
        noAddresses: 'У вас поки немає збережених адрес',
    },
    confirmation: {
        orderPlaced: 'Замовлення оформлено',
        success: 'Успішно',
        thankYou: 'Дякуємо за ваше замовлення!',
        orderConfirmed: 'Ваше замовлення успішно оформлено. Ми надіслали підтвердження на ваш email.',
        orderNumber: 'Номер замовлення:',
        ecoImpact: 'Ваш еко-внесок',
        co2Saved: 'CO2 врятовано',
        mealsSaved: 'страв врятовано',
        moneySaved: 'заощаджено',
        thankYouEco: 'Дякуємо — ви рятуєте їжу!',
        orderStatus: 'Статус замовлення',
        statusPending: 'В очікуванні',
        statusProcessing: 'В обробці',
        statusReady: 'Готовий до видачі',
        statusCompleted: 'Завершено',
        statusCancelled: 'Скасовано',
        processingDescription: 'Магазин отримав ваше замовлення і готує його',
        readyPickup: 'Ви зможете забрати замовлення з магазину',
        readyDelivery: 'Кур\'єр доставить замовлення за вказаною адресою',
        completedPickup: 'Ви отримали замовлення',
        completedDelivery: 'Замовлення доставлено',
        items: 'Товари',
        orderInfo: 'Інформація про замовлення',
        pickup: 'Самовивіз',
        delivery: 'Доставка',
        expressDelivery: 'Експрес-доставка',
        cardPayment: 'Карткою',
        cashPayment: 'Готівкою при отриманні',
        onlinePayment: 'Онлайн-платіж',
        payment: 'Оплата',
        paid: 'Оплачено',
        payOnReceive: 'При отриманні',
        pickupCode: 'Код для отримання:',
        estimatedReady: 'Очікувана дата готовності:',
        estimatedDelivery: 'Очікувана дата доставки:',
        storeAddress: 'Адрес магазина',
        noAddress: 'Адреса не вказана',
        courierDelivery: 'Доставка кур\'єром',
        subtotal: 'Товарів на суму',
        deliveryFee: 'Доставка',
        free: 'Безкоштовно',
        serviceRates: 'За тарифами служби',
        total: 'Всього',
        thankYouPlanet: 'Дякуємо за замовлення! Ви допомагаєте планеті!',
        backToHome: 'Повернутися на головну',
        myOrders: 'Мої замовлення',
        loading: 'Завантаження інформації про замовлення...',
        loadError: 'Не вдалося завантажити інформацію про замовлення',
        toHome: 'На головну',
        noOrderId: 'No order ID provided',
    },
    orders: {
        yourOrders: 'Ваші замовлення',
        noOrdersYet: 'У вас ще немає замовлень',
        ordersWillAppearHere: 'Ваші замовлення з\'являться тут після здійснення покупки',
        checkout: 'Оформлення замовлення',
        customerDetails: 'Дані клієнта',
        paymentMethod: 'Спосіб оплати',
        orderSummary: 'Підсумок замовлення',
        confirmOrder: 'Підтвердити замовлення',
        PROCESSING: 'В обробці',
        processing: 'Обробка...',
        pickupAtStore: 'Забрати в магазині',
        payAtPickup: 'Оплата при отриманні',
        paymentOnCollection: 'Оплата здійснюється при отриманні замовлення',
        checkoutDisclaimer: 'Підтверджуючи замовлення, ви погоджуєтеся з нашими Умовами використання та Політикою конфіденційності',
        errorLoadingOrders: 'Помилка завантаження замовлень',
        orderStatus: 'Статус замовлення',
        total: 'Всього',
        orderDetails: 'Деталі замовлення',
        orderNotFound: 'Замовлення не знайдено',
        orderNotFoundDesc: 'Це замовлення не існує або було видалено',
        orderAgain: 'Замовити ще раз',
        backToHistory: 'Повернутись до історії',
        storeInfo: 'Інформація про магазин',
        storeInformation: 'Інформація про магазин',
        viewStore: 'Переглянути магазин',
        showCodeToPickUp: 'Покажіть цей код при отриманні замовлення',
        codeCopied: 'Код скопійовано',
        codeReadyToUse: 'Код готовий до використання',
        orderedOn: 'Замовлено',
        yourImpact: 'Ваш вплив',
        moneySaved: 'Зекономлено грошей',
        co2Saved: 'Зекономлено CO2',
        orderCancelled: 'Замовлення скасовано',
        orderCancelledSuccess: 'Ваше замовлення було успішно скасовано',
        errorCancellingOrder: 'Помилка скасування замовлення',
        errorLoadingOrderDetails: 'Помилка завантаження деталей замовлення',
        quantity: 'Кількість',
        needHelp: 'Потрібна допомога?',
        contactSupport: 'Зв\'язатися з підтримкою',
        cancelOrder: 'Скасувати замовлення',
        orderNumber: 'Замовлення №',
        orderItems: 'Товари в замовленні',
        orderDate: 'Дата замовлення',
        orderTime: 'Час замовлення',
        pickupCode: 'Код отримання',
        orderInformation: 'Інформація про замовлення',
        tooManyAttempts: 'Забагато спроб',
        reloadPageToRetry: 'Перезавантажте сторінку, щоб спробувати знову',
    },
    support: {
        errorSendingMessage: 'Помилка надсилання повідомлення',
        reloadPageToRetry: 'Перезавантажте сторінку, щоб спробувати знову',
        describeIssue: 'Опишіть вашу проблему або питання...',
        subject: 'Тема',
        message: 'Повідомлення',
        pleaseEnterMessage: 'Будь ласка, введіть повідомлення',
        messageSent: 'Ваше повідомлення надіслано. Ми зв\'яжемося з вами найближчим часом!',
        faqHowItWorks: 'Як працює FoodWise?',
        faqHowItWorksAnswer: 'FoodWise з\'єднує вас з місцевими ресторанами та магазинами, щоб рятувати залишки їжі за зниженими цінами.',
        faqCanCancel: 'Чи можу я скасувати замовлення?',
        faqCanCancelAnswer: 'Замовлення можна скасувати за 30 хвилин до часу видачі без штрафу.',
        faqMissPickup: 'Що, якщо я пропущу час видачі?',
        faqMissPickupAnswer: 'Якщо ви пропустите час видачі, замовлення буде скасовано і повернення коштів не буде здійснено.',
        callUsAt: 'Телефонуйте нам:',
    },
    checkout: {
        onlinePayment: 'Онлайн оплата',
        cashPayment: 'Готівкою',
        paymentFormNotReady: 'Платіжна форма ще не готова',
        verifyCardDetails: 'Перевірте дані картки',
        paymentFailed: 'Платіж не вдався',
        stripeProtected: 'Платіж захищений Stripe. Ми не зберігаємо дані вашої картки.',
        onlinePaymentUnavailable: 'Онлайн-оплата тимчасово недоступна',
        preparingPayment: 'Готуємо платіж...',
        processingPayment: 'Обробка...',
        bankConfirmation: 'Підтвердження банку...',
        ready: 'Готово',
        paymentSuccess: 'Платіж успішний',
        paymentDidNotGoThrough: 'Платіж не пройшов',
        tryAgain: 'Спробувати ще',
        fillRequiredFields: 'Будь ласка, заповніть назву, вулицю та місто',
        waitForAddressesLoading: 'Будь ласка, зачекайте, адреси завантажуються',
        failedToSaveAddress: 'Не вдалося зберегти адресу',
        ecoImpact: 'Еко-вплив',
        confirmingOrder: 'Підтвердження замовлення...',
        creatingOrder: 'Створення замовлення...',
        orByCard: 'або карткою',
        stripeProtectedShort: 'Платіж захищений Stripe. Ваші дані не зберігаються на нашому сервері.',
        stripeNotConfigured: 'Stripe ще не налаштований. Оберіть оплату готівкою або поверніться пізніше.',
        waitingForAmount: 'Очікуємо суму замовлення...',
        title: 'Оформлення замовлення',
        deliveryMethod: 'Спосіб доставки',
        deliveryMethodDescription: 'Виберіть, як ви хочете отримати замовлення',
        pickupAtStore: 'Самовивіз з магазину',
        free: 'Безкоштовно',
        courierDelivery: 'Доставка кур\'єром',
        deliveryByRates: 'За тарифами сервісу',
        deliveryAddress: 'Адреса доставки',
        clickToChange: 'Натисніть, щоб змінити',
        noSavedAddresses: 'У вас немає збережених адрес',
        editAddressAria: 'Змінити адресу',
        addNewAddress: 'Додати нову адресу',
        enterNewAddress: 'Вкажіть нову адресу доставки',
        editAddress: 'Редагувати адресу',
        newAddressTitle: 'Нова адреса',
        addressLabelRequired: 'Назва адреси*',
        addressLabelPlaceholder: 'Наприклад: Дім, Робота',
        streetRequired: 'Вулиця, будинок, квартира*',
        streetPlaceholderExample: 'вул. Хрещатик, 1, кв. 5',
        cityRequired: 'Місто*',
        cityPlaceholderExample: 'Київ',
        regionLabel: 'Область',
        regionPlaceholderExample: 'Київська область',
        postalCodeRequired: 'Поштовий індекс*',
        countryRequired: 'Країна*',
        countryPlaceholderExample: 'Україна',
        addressType: 'Тип адреси',
        addressTypeHome: 'Домашня',
        addressTypeWork: 'Робоча',
        addressTypeOther: 'Інша',
        setAsDefault: 'Встановити як адресу за замовчуванням',
        addressPreview: 'Попередній перегляд адреси:',
        savingProgress: 'Збереження...',
        saveChanges: 'Зберегти зміни',
        saveAddress: 'Зберегти адресу',
        cancelEdit: 'Скасувати',
        itemsCount: 'Товари',
        paymentMethod: 'Спосіб оплати',
        paymentMethodDescription: 'Виберіть, як ви хочете оплатити замовлення',
        cashOnlyForPickup: 'Оплата готівкою доступна тільки для самовивозу',
        payOnReceipt: 'Оплата при отриманні',
        payOnReceiptDescription: 'Заплатіть готівкою або карткою, коли заберете замовлення в магазині.',
        promoCode: 'Промокод',
        enterPromoCode: 'Введіть промокод',
        apply: 'Застосувати',
        applyShort: 'ОК',
        pickupFree: 'Самовивіз (безкоштовно)',
        delivery: 'Доставка',
        addressLabel: 'Адреса',
        total: 'Всього',
        iAccept: 'Я приймаю умови',
        termsOfService: 'Користувацької угоди',
        and: 'і',
        privacyPolicy: 'Політику конфіденційності',
        protectedPayment: 'Захищена оплата · SSL',
        payButton: 'Оплатити',
        confirmOrder: 'Підтвердити замовлення',
        provideDeliveryAddress: 'Будь ласка, вкажіть нову адресу доставки',
        addDeliveryAddress: 'Будь ласка, додайте адресу доставки',
        selectDeliveryAddress: 'Будь ласка, виберіть адресу доставки',
        geolocationFailedFallback: 'Не вдалося отримати ваше місцезнаходження. Використовуються координати за замовчуванням.',
        geolocationNotSupportedShort: 'Геолокація не підтримується вашим браузером.',
        failedToCreateOrder: 'Не вдалося створити замовлення',
        paymentSessionNoSecret: 'Не вдалося розпочати платіж. Спробуйте ще раз.',
        serverCommunicationError: 'Помилка зв\'язку з сервером. Спробуйте ще раз.',
        paymentNotConfirmed: 'Платіж не підтверджено',
        unknownError: 'Невідома помилка',
        failedToSaveAddressRetry: 'Не вдалося зберегти адресу. Спробуйте ще раз.',
    },
    cart: {
        title: 'Кошик',
        emptyCart: 'Ваш кошик пустий',
        addItemsDescription: 'Додайте товари з наших пропозицій, щоб врятувати їжу від викиду',
        viewOffers: 'Переглянути пропозиції',
        clearCart: 'Очистити кошик',
        confirmClearCart: 'Очистити кошик?',
        proceedToCheckout: 'Перейти до оформлення',
        items: 'Товари',
        orderInfo: 'Інформація про замовлення',
        savingThePlanet: 'Ви рятуєте планету!',
        loginRequired: 'Для оформлення замовлення необхідно авторизуватися',
        loginAndCheckout: 'Увійти та оформити замовлення',
        termsAgreement: 'Натискаючи кнопку, ви погоджуєтеся з умовами сервісу',
        decreaseQuantity: 'Зменшити кількість',
        increaseQuantity: 'Збільшити кількість',
        removeItem: 'Видалити товар',
        showRemoveOptions: 'Показати опції видалення',
        cancelRemove: 'Скасувати видалення',
        totalForItems: 'Всього за',
        itemOne: 'товар',
        itemFew: 'товари',
        itemMany: 'товарів',
    },
    search: {
        title: 'Пошук',
        inDevelopment: 'Сторінка пошуку в розробці',
        placeholder: 'Що шукаєте?',
    },
    invite: {
        title: 'Запросіть друзів та отримайте бонуси',
        shareTitle: 'Приєднуйтесь до FoodWise',
        shareText: 'Скористайтесь моїм реферальним кодом FOODWISE2024, щоб отримати знижку на перше замовлення!',
        referralCopied: 'Реферальний код скопійовано в буфер обміну',
        copyFailed: 'Не вдалося скопіювати код',
        sharingNotSupported: 'Поділитися не підтримується вашим браузером',
    },
    storeTypes: {
        RESTAURANT: 'Ресторани',
        CAFE: 'Кафе',
        BAKERY: 'Пекарні',
        GROCERY: 'Продукти',
        SWEETS: 'Солодощі',
        OTHER: 'Інше',
    },
    storeGroups: {
        FOOD_SERVICE: 'Готова їжа',
        RETAIL: 'Магазини',
    },
    favorites: {
        title: 'Обране',
        count: '{count} магазинів у обраному',
        emptyTitle: 'Поки що порожньо',
        emptyDescription: 'Додавайте улюблені магазини, щоб швидко повертатися до них і не пропускати рятувальні бокси.',
        browseCta: 'Знайти магазини',
        storeUnavailable: 'Магазин більше недоступний',
        addedToast: 'Додано в обране',
        removedToast: 'Видалено з обраного',
        errorToast: 'Не вдалося оновити обране',
        addAriaLabel: 'Додати в обране',
        removeAriaLabel: 'Прибрати з обраного',
    },
};

// Define the English translations
export const enTranslations: TranslationKeys = {
    navigation: {
        recommendations: 'Recommendations',
        restaurants: 'Restaurants',
        stores: 'Stores',
        cart: 'Cart',
        profile: 'Profile',
        favorites: 'Favorites',
    },
    error: {
        somethingWentWrong: 'Something went wrong',
        pleaseTryAgain: 'Please try again',
        refresh: 'Refresh',
        serviceUnavailable: 'Service Unavailable',
        tryAgainLater: 'Our servers are experiencing issues. Please try again later.',
        backToHome: 'Back to Home',
        serversTemporarilyUnavailable: 'Our servers are temporarily unavailable. We\'re working to restore service as quickly as possible.',
        unexpectedErrorOccurred: 'An unexpected error occurred. Please try again.',
        tryAgain: 'Try Again'
    },
    restaurants: {
        searchPlaceholder: 'Search for restaurants or locations',
        filters: 'Filters',
        minRating: 'Minimum Rating',
        maxDistance: 'Maximum Distance',
        openNow: 'Open Now',
        resetFilters: 'Reset Filters',
        hideMap: 'Hide Map',
        showMap: 'Show Map',
        popularRestaurants: 'Popular Restaurants',
        nearbyRestaurants: 'Nearby You',
        recommendedRestaurants: 'Recommended',
        allRestaurants: 'All Restaurants',
        loadMore: 'Load More',
        noPopularRestaurants: 'No popular restaurants',
        noNearbyRestaurants: 'No restaurants nearby',
        noRecommendedRestaurants: 'No recommended restaurants',
        noRestaurantsFound: 'Nothing found, try changing filters',
        mapPlaceholder: 'Restaurant map will be here',
        allPopularRestaurants: 'All Popular Restaurants',
        loadingMap: 'Loading map...',
        noRestaurantsOnMap: 'No restaurants on map',
        waitingForLocation: 'Waiting for location...',
        restaurantsMap: 'Restaurant Map',
    },
    common: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        or: 'or',
        all: 'All',
        search: 'Search',
        timeLeft: 'Time Left',
        rescue: 'Rescue',
        exploreBoxes: 'Explore Stores',
        copyright: '© 2025 FoodWise',
        backHome: 'Back Home',
        uploading: 'Uploading...',
        saving: 'Saving...',
        saved: 'Saved',
        back: 'Back',
        loadMore: 'Load More',
        startExploring: 'Start exploring available offers',
        exploreNow: 'Explore Now',
        kg: 'kg',
        demoMode: 'Demo Mode',
        retry: 'Retry',
        copy: 'Copy',
        share: 'Share',
        copied: 'Copied',
        linkCopiedToClipboard: 'Link copied to clipboard',
        minutes: 'min',
        noResults: 'No results found',
        tryDifferentSearch: 'Try a different search',
        showAll: 'Show all',
        cancel: 'Cancel',
        off: 'off',
        left: 'left',
        processing: 'Processing...',
        refresh: 'Refresh',
        addedToCart: 'Added to cart',
        addError: "Couldn't add — try again",
        addToCart: 'Add to Cart',
        adding: 'Adding...',
        addingToCart: 'Adding to cart...',
        comingSoon: 'Coming soon',
        remove: 'Remove',
        delete: 'Delete',
        kmShort: 'km',
        storePhotoAlt: 'Store photo',
        ratingLabel: 'Rating',
        required: 'Required field',
        maxLength: 'Maximum {n} characters',
        minLength: 'Minimum {n} characters',
        lettersOnly: 'Letters, spaces and hyphens only',
        postalCodeDigits: 'Postal code: digits only (4–10)',
        invalidChars: 'Contains invalid characters',
    },
    store: {
        searchMenu: 'Search menu...',
        open: 'Open',
        closed: 'Closed',
        minOrder: 'Min. order',
        delivery: 'Delivery',
        sellerInfo: 'Seller information',
        sellerDetailsInfo: 'Seller details information',
        aboutSeller: 'About seller',
        shareText: 'Check out ${name} on our website!',
        recentlyBought: 'Recently bought',
        item: 'item',
        items: 'items',
        errorLoadingStore: 'Error loading store',
        errorAddingToCart: 'Error adding to cart',
        pickup: 'Pickup',
        recommended: 'Recommended',
        allAvailableBoxes: 'All available boxes',
        description: 'Description',
        details: 'Details',
        workingHours: 'Working hours',
        address: 'Address',
        noSurpriseBoxes: 'No surprise boxes available',
        noSurpriseBoxesDescription: 'There are no surprise boxes available at this store',
    },
    auth: {
        login: 'Login',
        loggingIn: 'Logging in...',
        register: 'Register',
        logout: 'Logout',
        loginSuccess: 'You have successfully logged in',
        logoutSuccess: 'You have successfully logged out',
        logoutError: 'Logout error',
        email: 'Email',
        password: 'Password',
        noAccount: 'Don\'t have an account?',
        emailPlaceholder: 'example@email.com',
        passwordPlaceholder: '••••••••',
        loginError: 'Login Error',
        invalidCredentials: 'Invalid credentials',
        fieldRequired: 'Please fill in all fields',
        heroTitle1: 'Save food,',
        heroTitle2: 'save money',
        heroSubtitle: 'Join the community of conscious consumers who save food from waste and make the planet a better place.',
        step1Title: 'Choose',
        step1Desc: 'Find surprise boxes nearby with 30-70% discount',
        step2Title: 'Pick up',
        step2Desc: 'Collect your order from a restaurant or store',
        step3Title: 'Save',
        step3Desc: 'Food does not end up in the trash, and the planet thanks you',
        passwordsDontMatch: 'Passwords do not match',
        passwordRequirements: 'Password requirements:',
        passwordMinLength: 'Password must contain at least 8 characters, an uppercase letter, a number and a special character',
        registrationError: 'Registration error',
        registrationFailed: 'Failed to register',
        passwordTooWeak: 'Very weak',
        passwordWeak: 'Weak',
        passwordFair: 'Fair',
        passwordGood: 'Good',
        passwordStrong: 'Strong',
        passwordVeryStrong: 'Very strong',
        passwordStrength: 'Password strength',
        atLeast8Chars: 'At least 8 characters',
        uppercase: 'Uppercase letter (A-Z)',
        lowercase: 'Lowercase letter (a-z)',
        number: 'Number (0-9)',
        specialChar: 'Special character (!@#$...)',
        confirmPassword: 'Confirm password',
        showPassword: 'Show password',
        hidePassword: 'Hide password',
        optional: 'optional',
        passwordRule8Chars: 'At least 8 characters',
        passwordRuleUppercase: 'At least 1 uppercase letter',
        passwordRuleNumber: 'At least 1 number',
        passwordRuleSpecial: 'At least 1 special character (!@#$%^&*)',
        passwordMedium: 'Medium',
        googleSignInNotConfigured: 'Google Sign-In is not configured (NEXT_PUBLIC_GOOGLE_CLIENT_ID missing)',
        googleSignInLoading: 'Google Sign-In is still loading, please try again',
    },
    app: {
        appName: 'FoodWise',
        slogan: 'Save food, save money',
    },
    buttons: {
        signInWithGoogle: 'Sign in with Google',
        signInWithTelegram: 'Sign in with Telegram',
    },
    home: {
        searchPlaceholder: 'Search boxes or locations',
        saveFood: 'Save Food',
        saveMoney: 'Save Money',
        savePlanet: 'Save Planet',
        lateLunch: 'Late lunch nearby',
        heroEyebrow: 'Surprise boxes nearby',
        heroBadge: 'Today · up to -70%',
        promotionalCarousel: 'Promotional carousel',
        noResultsInCategory: 'No boxes available in this category',
        noResultsForSearch: 'No boxes found for your search',
        noBoxesAvailable: 'No surprise boxes available right now',
        featuredStores: 'Featured Stores',
        noFeaturedStores: 'No featured stores available',
        nearbyStores: 'Stores Nearby',
        nearbyStoresMap: 'Nearby stores map',
        mapOfNearbyStores: 'Map of nearby stores',
        loadingLocation: 'Loading location...',
        yourLocation: 'Your location',
        noNearbyStores: 'No stores found nearby',
        stores: 'Stores',
        noStoresInCategory: 'No stores found in this category',
        storeSearchResults: 'Store Search Results',
        noStoreSearchResults: 'No stores match your search',
    },
    categories: {
        bakery: 'Bakery',
        cafe: 'Cafe',
        restaurant: 'Restaurant',
        grocery: 'Grocery',
        sweets: 'Sweets',
        other: 'Other',
        categoryItems: 'Category items',
        loadingMore: 'Loading more...',
        loadMore: 'Load more',
        noItemsFound: 'No items found',
        resetFilters: 'Reset filters',
        noItemsOnMap: 'No items on map',
        waitingForLocation: 'Waiting for location...',
        filters: 'Filters',
        itemsMap: 'Items map',
        minRating: 'Minimum rating',
        maxDistance: 'Maximum distance',
        openNow: 'Open now',
        priceLevel: 'Price level',
        sortBy: 'Sort by',
        selectSortOption: 'Select sort option',
        byRating: 'By rating',
        byDistance: 'By distance',
        byPriceAsc: 'By price (ascending)',
        byPriceDesc: 'By price (descending)',
    },
    map: {
        searchForPickups: 'Search for pickups...',
        panToCurrentLocation: 'Pan to Current Location',
        geolocationFailed: 'Error: The Geolocation service failed.',
        browserDoesntSupportGeolocation: 'Error: Your browser doesn\'t support geolocation.',
        viewDetails: 'View Details',
        yourLocation: 'Your location',
    },
    profile: {
        myProfile: 'My Profile',
        personalData: 'Personal Data',
        statistics: 'Statistics',
        ordersHistory: 'Orders History',
        name: 'Name',
        yourName: 'Your name',
        address: 'Address',
        yourAddress: 'Your address',
        preferences: 'Preferences',
        yourPreferencesPlaceholder: 'Your preferences',
        emailCannotBeChanged: 'Email cannot be changed',
        saveChanges: 'Save Changes',
        profileUpdated: 'Profile Updated',
        yourDataSuccessfullySaved: 'Your data has been successfully saved',
        errorLoadingProfile: 'Failed to load profile data',
        updateProfileError: 'Error updating profile',
        failedToUpdateProfile: 'Failed to update profile',
        reloadPageToRetry: 'Please reload the page to try again',
        ordersCompleted: 'Orders completed',
        itemsSaved: 'Items saved',
        savings: 'Savings',
        saved: 'saved',
        noOrders: 'You don\'t have any orders yet',
        order: 'Order',
        store: 'Store',
        total: 'Total',
        pickupCode: 'Pickup code',
        orderDetails: 'Order details',
        inviteFriends: 'Invite Friends',
        activateCode: 'Activate Code',
        support: 'Support',
        settings: 'Settings',
        paymentMethods: 'Payment Methods',
        addresses: 'Addresses',
        profileNotFound: 'Profile not found',
        hi: 'Hi',
        totalSaved: 'Total saved',
        orderAgain: 'Order Again',
        popularLinks: 'Popular Links',
        personalInfo: 'Personal Information',
        photoUpdated: 'Photo updated',
        cards: 'cards',
        orders: 'orders',
        // Payment methods page
        makeDefault: 'Make Default',
        addPaymentMethod: 'Add Payment Method',
        defaultPayment: 'Default',
        cardDetails: 'Card Details',
        expires: 'Expires',
        securePayment: 'We use secure payment processing and never store your full card details.',
        // Address page
        addAddress: 'Add Address',
        defaultAddress: 'Default Address',
        // Invite friends
        yourReferralCode: 'Your Referral Code',
        shareWithFriends: 'Share your code with friends and get discounts',
        invitedFriends: 'You\'ve invited 0 friends so far',
        earnRewards: 'Earn up to ₴2000 in rewards!',
        shareYourInvite: 'Share Your Invite',
        howItWorks: 'How It Works',
        shareCode: 'Share your unique code with friends',
        friendSignsUp: 'Your friend signs up using your code',
        theyGetDiscount: 'They get ₴200 off their first order',
        youGetCredit: 'You get ₴200 credited to your account when they complete their first order',
        // Activate code
        promoCode: 'Promo Code',
        enterPromoCode: 'Enter your promo code',
        activateButton: 'Activate Code',
        activating: 'Activating...',
        popularCodes: 'Popular promo codes:',
        pleaseEnterCode: 'Please enter a code',
        codeActivated: 'Code activated successfully! You received ₴200 credit',
        invalidCode: 'Invalid or expired code',
        welcomeBonus: 'Get ₴200 off your first order',
        summerDiscount: '10% discount on all summer boxes',
        demoHint: '*Enter \'WELCOME50\' to see a successful activation demo',
        // Support
        contactSupport: 'Contact Support',
        howCanWeHelp: 'How can we help you?',
        sendMessage: 'Send Message',
        sending: 'Sending...',
        faq: 'FAQ',
        needHelp: 'Need immediate assistance?',
        callUs: 'Call us at:',
        workingHours: 'Available 9:00 - 18:00, Monday - Friday',
        // Order details
        orderInformation: 'Order Information',
        orderDate: 'Order Date',
        orderTime: 'Order Time',
        orderStatus: 'Order Status',
        storeInformation: 'Store Information',
        contactStore: 'Contact Store',
        getDirections: 'Get Directions',
        orderItems: 'Order Items',
        cancelOrder: 'Cancel Order',
        helpWithOrder: 'Need help with this order?',
        // Order statuses
        pending: 'Pending confirmation',
        confirmed: 'Confirmed',
        processing: 'Processing',
        ready: 'Ready for pickup',
        completed: 'Completed',
        cancelled: 'Cancelled',
        unknownStatus: 'Unknown status',
    },
    merchant: {
        merchantDashboard: 'Merchant Dashboard',
        activeBoxes: 'Active Boxes',
        ordersToday: 'Orders Today',
        revenue: 'Revenue',
        createBox: 'Create Box',
        viewOrders: 'View Orders',
        viewAnalytics: 'View Analytics',
        gettingStarted: 'Getting Started',
        welcomeMessage: 'Welcome to your merchant dashboard! Start rescuing food and increasing your revenue.',
        step1Title: 'Create your first box',
        step1Description: 'Add a description, photo, and set a discount for your box.',
        step2Title: 'Manage availability',
        step2Description: 'Set the hours when customers can pick up their orders.',
        step3Title: 'Receive orders',
        step3Description: 'Check for new orders and prepare boxes for pickup.',
        createFirstBox: 'Create First Box',
    },
    orderStatus: {
        pending: 'Pending confirmation',
        confirmed: 'Confirmed',
        processing: 'Preparing',
        ready: 'Ready for pickup',
        completed: 'Completed',
        cancelled: 'Cancelled',
        unknown: 'Unknown status',
    },
    payment: {
        visa: 'Visa',
        mastercard: 'Mastercard',
        expires: 'Expires',
        makeDefault: 'Make Default',
        default: 'Default',
        defaultUpdated: 'Default payment method updated',
        cannotRemoveDefault: 'Cannot remove default payment method',
        paymentMethodRemoved: 'Payment method removed',
        addPaymentMethod: 'Add Payment Method',
        paymentInformation: 'Payment Information',
        secureProcessing: 'We use secure payment processing',
        multiplePaymentMethods: 'Add multiple payment methods for convenience',
        defaultPaymentMethod: 'Default payment method is used automatically',
        demoDescription: 'Adding new payment methods is not available in demo mode',
    },
    address: {
        default: 'Default',
        makeDefault: 'Make Default',
        defaultUpdated: 'Default address updated',
        cannotRemoveDefault: 'Cannot remove default address',
        addressRemoved: 'Address removed',
        addNewAddress: 'Add New Address',
        yourAddresses: 'Your Addresses',
        addressInformation: 'Address Information',
        defaultAddressCheckout: 'Default address is used at checkout',
        multipleAddresses: 'Add multiple addresses for different purposes',
        accurateInformation: 'Provide accurate information to avoid delivery issues',
        home: 'Home',
        work: 'Work',
        other: 'Other',
        demoDescription: 'Adding new addresses is not available in demo mode',
        getDirections: 'Get Directions',
        loadingError: 'There was a problem loading your addresses',
        // Address form fields
        addressTitle: 'Address Title',
        titlePlaceholder: 'Example: Home, Work, Vacation',
        addressType: 'Address Type',
        selectAddressType: 'Select address type',
        fullAddress: 'Full Address',
        fullAddressPlaceholder: 'Khreshchatyk St, 1, Kyiv, Ukraine',
        street: 'Street',
        streetPlaceholder: 'Khreshchatyk St, 1, apt. 5',
        city: 'City',
        cityPlaceholder: 'Kyiv',
        state: 'State/Region',
        statePlaceholder: 'Kyiv Oblast',
        postalCode: 'Postal Code',
        postalCodePlaceholder: '01001',
        country: 'Country',
        countryPlaceholder: 'Ukraine',
        saveAddress: 'Save Address',
        saveChanges: 'Save changes',
        editAddress: 'Edit address',
        setAsDefault: 'Set as default address',
        addressPreview: 'Address preview:',
        // Address management messages
        addressAdded: 'Address successfully added',
        failedToAdd: 'Failed to add address',
        failedToLoad: 'Failed to load addresses',
        failedToUpdate: 'Failed to update address',
        failedToRemove: 'Failed to delete address',
        noAddresses: 'You don\'t have any saved addresses yet',
    },
    confirmation: {
        orderPlaced: 'Order Placed',
        success: 'Success',
        thankYou: 'Thank you for your order!',
        orderConfirmed: 'Your order has been successfully placed. We have sent a confirmation to your email.',
        orderNumber: 'Order number:',
        ecoImpact: 'Your eco impact',
        co2Saved: 'CO2 saved',
        mealsSaved: 'meals saved',
        moneySaved: 'saved',
        thankYouEco: 'Thank you — you are saving food!',
        orderStatus: 'Order Status',
        statusPending: 'Pending',
        statusProcessing: 'Processing',
        statusReady: 'Ready for pickup',
        statusCompleted: 'Completed',
        statusCancelled: 'Cancelled',
        processingDescription: 'The store has received your order and is preparing it',
        readyPickup: 'You can pick up your order from the store',
        readyDelivery: 'A courier will deliver the order to your address',
        completedPickup: 'You have received your order',
        completedDelivery: 'Order delivered',
        items: 'Items',
        orderInfo: 'Order Information',
        pickup: 'Pickup',
        delivery: 'Delivery',
        expressDelivery: 'Express Delivery',
        cardPayment: 'Card',
        cashPayment: 'Cash on delivery',
        onlinePayment: 'Online payment',
        payment: 'Payment',
        paid: 'Paid',
        payOnReceive: 'Pay on receive',
        pickupCode: 'Pickup code:',
        estimatedReady: 'Estimated ready date:',
        estimatedDelivery: 'Estimated delivery date:',
        storeAddress: 'Store address',
        noAddress: 'Address not specified',
        courierDelivery: 'Courier delivery',
        subtotal: 'Subtotal',
        deliveryFee: 'Delivery',
        free: 'Free',
        serviceRates: 'Service rates apply',
        total: 'Total',
        thankYouPlanet: 'Thank you for your order! You are helping the planet!',
        backToHome: 'Back to Home',
        myOrders: 'My Orders',
        loading: 'Loading order information...',
        loadError: 'Failed to load order information',
        toHome: 'To Home',
        noOrderId: 'No order ID provided',
    },
    orders: {
        yourOrders: 'Your Orders',
        noOrdersYet: 'You don\'t have any orders yet',
        ordersWillAppearHere: 'Your orders will appear here after making a purchase',
        checkout: 'Checkout',
        customerDetails: 'Customer Details',
        paymentMethod: 'Payment Method',
        orderSummary: 'Order Summary',
        confirmOrder: 'Confirm Order',
        PROCESSING: 'Processing',
        processing: 'Processing...',
        pickupAtStore: 'Pickup at store',
        payAtPickup: 'Pay at Pickup',
        paymentOnCollection: 'Payment will be made upon collecting your order',
        checkoutDisclaimer: 'By confirming your order, you agree to our Terms of Service and Privacy Policy',
        errorLoadingOrders: 'Error loading orders',
        orderStatus: 'Order Status',
        total: 'Total',
        orderDetails: 'Order Details',
        orderNotFound: 'Order not found',
        orderNotFoundDesc: 'This order does not exist or has been removed',
        orderAgain: 'Order Again',
        backToHistory: 'Back to order history',
        storeInfo: 'Store Information',
        storeInformation: 'Store Information',
        viewStore: 'View Store',
        showCodeToPickUp: 'Show this code when picking up your order',
        codeCopied: 'Code copied',
        codeReadyToUse: 'Your code is ready to use',
        orderedOn: 'Ordered on',
        yourImpact: 'Your Impact',
        moneySaved: 'Money Saved',
        co2Saved: 'CO2 Saved',
        orderCancelled: 'Order Cancelled',
        orderCancelledSuccess: 'Your order has been successfully cancelled',
        errorCancellingOrder: 'Error cancelling order',
        errorLoadingOrderDetails: 'Error loading order details',
        quantity: 'Quantity',
        needHelp: 'Need help?',
        contactSupport: 'Contact Support',
        cancelOrder: 'Cancel Order',
        orderNumber: 'Order #',
        orderItems: 'Order Items',
        orderDate: 'Order Date',
        orderTime: 'Order Time',
        pickupCode: 'Pickup Code',
        orderInformation: 'Order Information',
        tooManyAttempts: 'Too many attempts',
        reloadPageToRetry: 'Reload page to retry',
    },
    support: {
        errorSendingMessage: 'Error sending message',
        reloadPageToRetry: 'Reload page to retry',
        describeIssue: 'Describe your issue or question...',
        subject: 'Subject',
        message: 'Message',
        pleaseEnterMessage: 'Please enter a message',
        messageSent: 'Your message has been sent. We\'ll get back to you soon!',
        faqHowItWorks: 'How does FoodWise work?',
        faqHowItWorksAnswer: 'FoodWise connects you with local restaurants and stores to rescue surplus food at discounted prices.',
        faqCanCancel: 'Can I cancel my order?',
        faqCanCancelAnswer: 'Orders can be cancelled up to 30 minutes before the pickup time without penalty.',
        faqMissPickup: 'What if I miss my pickup time?',
        faqMissPickupAnswer: 'If you miss your pickup time, the order will be canceled and no refund will be issued.',
        callUsAt: 'Call us at:',
    },
    checkout: {
        onlinePayment: 'Online payment',
        cashPayment: 'Cash',
        paymentFormNotReady: 'Payment form is not ready yet',
        verifyCardDetails: 'Verify card details',
        paymentFailed: 'Payment failed',
        stripeProtected: 'Payment is protected by Stripe. We do not store your card details.',
        onlinePaymentUnavailable: 'Online payment is temporarily unavailable',
        preparingPayment: 'Preparing payment...',
        processingPayment: 'Processing...',
        bankConfirmation: 'Bank confirmation...',
        ready: 'Ready',
        paymentSuccess: 'Payment successful',
        paymentDidNotGoThrough: 'Payment did not go through',
        tryAgain: 'Try again',
        fillRequiredFields: 'Please fill in name, street and city',
        waitForAddressesLoading: 'Please wait, addresses are loading',
        failedToSaveAddress: 'Failed to save address',
        ecoImpact: 'Eco Impact',
        confirmingOrder: 'Confirming order...',
        creatingOrder: 'Creating order...',
        orByCard: 'or by card',
        stripeProtectedShort: 'Payment is protected by Stripe. Your details are not stored on our server.',
        stripeNotConfigured: 'Stripe is not configured. Select cash payment or come back later.',
        waitingForAmount: 'Waiting for order amount...',
        title: 'Checkout',
        deliveryMethod: 'Delivery method',
        deliveryMethodDescription: 'Choose how you want to receive your order',
        pickupAtStore: 'Pickup at store',
        free: 'Free',
        courierDelivery: 'Courier delivery',
        deliveryByRates: 'Service rates apply',
        deliveryAddress: 'Delivery address',
        clickToChange: 'Click to change',
        noSavedAddresses: 'You have no saved addresses',
        editAddressAria: 'Edit address',
        addNewAddress: 'Add new address',
        enterNewAddress: 'Provide a new delivery address',
        editAddress: 'Edit address',
        newAddressTitle: 'New address',
        addressLabelRequired: 'Address title*',
        addressLabelPlaceholder: 'Example: Home, Work',
        streetRequired: 'Street, house, apartment*',
        streetPlaceholderExample: 'Khreshchatyk St, 1, apt. 5',
        cityRequired: 'City*',
        cityPlaceholderExample: 'Kyiv',
        regionLabel: 'Region',
        regionPlaceholderExample: 'Kyiv Oblast',
        postalCodeRequired: 'Postal code*',
        countryRequired: 'Country*',
        countryPlaceholderExample: 'Ukraine',
        addressType: 'Address type',
        addressTypeHome: 'Home',
        addressTypeWork: 'Work',
        addressTypeOther: 'Other',
        setAsDefault: 'Set as default address',
        addressPreview: 'Address preview:',
        savingProgress: 'Saving...',
        saveChanges: 'Save changes',
        saveAddress: 'Save address',
        cancelEdit: 'Cancel',
        itemsCount: 'Items',
        paymentMethod: 'Payment method',
        paymentMethodDescription: 'Choose how you want to pay for your order',
        cashOnlyForPickup: 'Cash payment is only available for pickup',
        payOnReceipt: 'Pay on receipt',
        payOnReceiptDescription: 'Pay in cash or by card when you pick up the order at the store.',
        promoCode: 'Promo code',
        enterPromoCode: 'Enter promo code',
        apply: 'Apply',
        applyShort: 'OK',
        pickupFree: 'Pickup (free)',
        delivery: 'Delivery',
        addressLabel: 'Address',
        total: 'Total',
        iAccept: 'I accept the',
        termsOfService: 'Terms of Service',
        and: 'and',
        privacyPolicy: 'Privacy Policy',
        protectedPayment: 'Secure payment · SSL',
        payButton: 'Pay',
        confirmOrder: 'Confirm order',
        provideDeliveryAddress: 'Please provide a new delivery address',
        addDeliveryAddress: 'Please add a delivery address',
        selectDeliveryAddress: 'Please select a delivery address',
        geolocationFailedFallback: 'Could not get your location. Default coordinates are used.',
        geolocationNotSupportedShort: 'Geolocation is not supported by your browser.',
        failedToCreateOrder: 'Failed to create order',
        paymentSessionNoSecret: 'Could not start the payment. Please try again.',
        serverCommunicationError: 'Server communication error. Please try again.',
        paymentNotConfirmed: 'Payment not confirmed',
        unknownError: 'Unknown error',
        failedToSaveAddressRetry: 'Failed to save address. Please try again.',
    },
    cart: {
        title: 'Cart',
        emptyCart: 'Your cart is empty',
        addItemsDescription: 'Add items from our offers to save food from waste',
        viewOffers: 'View offers',
        clearCart: 'Clear cart',
        confirmClearCart: 'Clear the cart?',
        proceedToCheckout: 'Proceed to checkout',
        items: 'Items',
        orderInfo: 'Order information',
        savingThePlanet: 'You are saving the planet!',
        loginRequired: 'You need to log in to place an order',
        loginAndCheckout: 'Log in and checkout',
        termsAgreement: 'By clicking the button, you agree to the terms of service',
        decreaseQuantity: 'Decrease quantity',
        increaseQuantity: 'Increase quantity',
        removeItem: 'Remove item',
        showRemoveOptions: 'Show remove options',
        cancelRemove: 'Cancel remove',
        totalForItems: 'Total for',
        itemOne: 'item',
        itemFew: 'items',
        itemMany: 'items',
    },
    search: {
        title: 'Search',
        inDevelopment: 'Search page is under development',
        placeholder: 'What are you looking for?',
    },
    invite: {
        title: 'Invite Friends & Earn Rewards',
        shareTitle: 'Join FoodWise',
        shareText: 'Use my referral code FOODWISE2024 to get a discount on your first order!',
        referralCopied: 'Referral code copied to clipboard',
        copyFailed: 'Failed to copy code',
        sharingNotSupported: 'Sharing is not supported in your browser',
    },
    storeTypes: {
        RESTAURANT: 'Restaurants',
        CAFE: 'Cafés',
        BAKERY: 'Bakeries',
        GROCERY: 'Groceries',
        SWEETS: 'Sweets',
        OTHER: 'Other',
    },
    storeGroups: {
        FOOD_SERVICE: 'Food service',
        RETAIL: 'Retail',
    },
    favorites: {
        title: 'Favorites',
        count: '{count} stores saved',
        emptyTitle: 'Nothing here yet',
        emptyDescription: 'Save your favorite stores so you can come back quickly and never miss a rescue box.',
        browseCta: 'Browse stores',
        storeUnavailable: 'This store is no longer available',
        addedToast: 'Added to favorites',
        removedToast: 'Removed from favorites',
        errorToast: 'Could not update favorites',
        addAriaLabel: 'Add to favorites',
        removeAriaLabel: 'Remove from favorites',
    },
};

// Define available translations
export const translations = {
    uk: ukTranslations,
    en: enTranslations,
};
