"use client";

import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import {useLocale} from "@/contexts/locale-context";
import type {Category} from "@/types";

type CategoryChipsProps = {
    /**
     * Categories to render. Pass full Category objects (with `slug`) — slug is used
     * both for selection state and for building the URL in the caller.
     */
    categories: Category[];
    /** Currently selected slug (null = "all"). */
    selectedCategory?: string | null;
    /** Optional icon override keyed by slug. */
    categoryIcons?: Record<string, JSX.Element>;
    onSelect: (slug: string | null) => void;
    showAllCategory?: boolean;
    isLoading?: boolean;
};

export function CategoryChips({
    categories,
    selectedCategory,
    categoryIcons = {},
    onSelect,
    showAllCategory = true,
    isLoading = false,
}: CategoryChipsProps) {
    const {t} = useLocale();

    const handleCategoryClick = (slug: string) => {
        // If the slug is already selected, deselect it (return to "all")
        if (selectedCategory === slug) {
            onSelect(null);
        } else {
            onSelect(slug);
        }
    };

    return (
        <div
            className="opacity-100 transition-opacity duration-500"
        >
            <div
                className="scrollbar-hide flex space-x-2 p-2 overflow-x-auto overscroll-x-contain"
                style={{WebkitOverflowScrolling: "touch"}}
            >
                    {isLoading ? (
                        // Show loading skeleton when data is loading
                        Array.from({length: 5}).map((_, i) => (
                            <div key={i} className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                        ))
                    ) : (
                        <>
                            {/* All category - shown conditionally */}
                            {showAllCategory && (
                                <Button
                                    variant={selectedCategory === null ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => onSelect(null)}
                                    className={cn(
                                        "rounded-full",
                                        selectedCategory === null
                                            ? "bg-primary text-primary-foreground"
                                            : "border text-foreground hover:bg-secondary hover:text-secondary-foreground",
                                        "whitespace-nowrap"
                                    )}
                                    aria-pressed={selectedCategory === null}
                                >
                                    <span>{t("common", "all")}</span>
                                </Button>
                            )}
                    
                            {/* Other categories */}
                            {categories.map((category) => {
                                const slug = category.slug;
                                const isSelected = selectedCategory === slug;
                                const icon = categoryIcons[slug];
                                // Display label: prefer i18n by slug, fallback to backend display name.
                                const label = t("categories", slug as any) || category.name;
                                return (
                                    <Button
                                        key={category.id || slug}
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleCategoryClick(slug)}
                                        className={cn(
                                            "rounded-full",
                                            isSelected
                                                ? "bg-primary text-primary-foreground"
                                                : "border text-foreground hover:bg-secondary hover:text-secondary-foreground",
                                            "whitespace-nowrap"
                                        )}
                                        aria-pressed={isSelected}
                                    >
                                        {icon && <span className="mr-1">{icon}</span>}
                                        <span>{label}</span>
                                    </Button>
                                );
                            })}
                        </>
                    )}
                    
                    {isLoading && (
                        <div className="animate-spin w-4 h-4 border-2 border-primary rounded-full border-t-transparent ml-2"></div>
                    )}
            </div>
        </div>
    );
}
