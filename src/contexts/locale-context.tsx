"use client";

import {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import {Language, TranslationKeys, translations} from '@/lib/translations';

export type { Language };

// Module-level mirror of the current language for non-React readers
// (e.g. fetchAPI in lib/api.ts). Updated by the provider effect below.
let currentLanguage: Language = 'uk';
export const getCurrentLanguage = (): Language => currentLanguage;

// Define the context interface
interface LocaleContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string, subKey: string, defaultValue?: string) => string;
}

// Create the context
const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// Create the provider component
export function LocaleProvider({children}: Readonly<{ children: ReactNode }>) {
    // Default language is Ukrainian
    const [language, setLanguage] = useState<Language>('uk');

    // Load saved language preference from localStorage on mount
    useEffect(() => {
        // Use client-side only code to avoid SSR issues
        if (typeof window !== 'undefined') {
            const savedLanguage = localStorage.getItem('language') as Language;
            if (savedLanguage && (savedLanguage === 'uk' || savedLanguage === 'en')) {
                setLanguage(savedLanguage);
            }
        }
    }, []);

    // Save language preference when it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('language', language);
        }
    }, [language]);

    // Keep module-level mirror in sync for non-React readers (e.g. fetchAPI)
    useEffect(() => {
        currentLanguage = language;
    }, [language]);

    // Translation function
    const t = (key: string, subKey: string, defaultValue?: string): string => {
        const currentTranslation = translations[language] as Record<string, Record<string, string>>;
        const section = currentTranslation[key];
        if (!section) return defaultValue ?? subKey;
        return section[subKey] ?? defaultValue ?? subKey;
    };

    return (
        <LocaleContext.Provider value={{language, setLanguage, t}}>
            {children}
        </LocaleContext.Provider>
    );
}

// Custom hook for using the locale context
export function useLocale() {
    const context = useContext(LocaleContext);
    if (context === undefined) {
        throw new Error('useLocale must be used within a LocaleProvider');
    }
    return context;
}

// Alias for useLocale for components that expect useTranslation
export const useTranslation = useLocale;
