"use client";

import {Language, useLocale} from "@/contexts/locale-context";
import {Button} from "@/components/ui/button";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu";
import {Globe} from "lucide-react";

export default function LanguageSwitcher() {
    const {language, setLanguage} = useLocale();

    const languages: { code: Language; label: string }[] = [
        {code: "uk", label: "Українська"},
        {code: "en", label: "English"},
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 px-0" aria-label="Change language">
                    <Globe className="h-5 w-5"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[70]">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={language === lang.code ? "bg-gray-100 dark:bg-gray-800" : ""}
                    >
                        {lang.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
