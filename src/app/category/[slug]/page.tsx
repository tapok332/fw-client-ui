"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {useLocale} from "@/contexts/locale-context";
import {api} from "@/lib/api";
import {DEFAULT_LOCATION} from "@/lib/config";
import {useUtils} from "@/lib/utils-context";
import {useIntersectionObserver} from "@/hooks/use-intersection-observer";
import {ChevronLeft, Map, Sliders} from "lucide-react";
import {Button} from "@/components/ui/button";
import {CategoryFilter, FilterOptions} from "@/components/category/category-filter";
import {RestaurantMap as CategoryMap} from "@/components/restaurants/RestaurantMap";
import {BoxesSkeleton} from "@/components/home/boxes-skeleton";
import {EmptyState} from "@/components/home/empty-state";
import {Store as CategoryItem} from "@/types";
import {CategoryCard} from "@/components/category/category-card";

export default function CategoryPage() {
    const {t} = useLocale();
    const router = useRouter();
    const params = useParams();
    const categorySlug = params?.slug ? (Array.isArray(params.slug) ? params.slug[0] : params.slug as string) : "";

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filteredItems, setFilteredItems] = useState<CategoryItem[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [categoryInfo, setCategoryInfo] = useState<any | null>(null);
    const [userCoordinates, setUserCoordinates] = useState<{ lat: number, lng: number } | null>(null);
    const [showMap, setShowMap] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        minRating: 0,
        maxDistance: 10,
        openNow: false,
        priceLevel: [],
        sort: "rating"
    });
    const isInitialMount = useRef(true);
    const [loadMoreRef, isIntersecting] = useIntersectionObserver<HTMLDivElement>({
        threshold: 0.1,
        enabled: hasMore && !isLoading && !isLoadingMore
    });
    const utils = useUtils();
    const {categoryIcons: categoryIconsData, isLoading: isUtilsLoading} = utils;

    const handleToggleMap = () => {
        setShowMap((v) => !v);
    };

    const handleCategorySelect = (category: string | null) => {
        if (category === null || category === "all") {
            window.location.href = "/items";
        } else {
            window.location.href = `/category/${encodeURIComponent(category)}`;
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const resetFilters = async () => {
        setFilterOptions({
            minRating: 0,
            maxDistance: 10,
            openNow: false,
            priceLevel: [],
            sort: "rating"
        });
        setSearchQuery("");
        if (!categorySlug) return;
        setIsLoading(true);
        try {
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
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("Failed to reset filters:", err);
        } finally {
            setIsLoading(false);
        }
    };

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
            // eslint-disable-next-line no-console
            console.error("Failed to apply filters:", err);
            setError(err instanceof Error ? err : new Error('Failed to apply filters'));
        } finally {
            setIsLoading(false);
        }
    }, [categorySlug, searchQuery, filterOptions, userCoordinates]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserCoordinates({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                () => {
                    setUserCoordinates({lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng});
                }
            );
        } else {
            setUserCoordinates({lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng});
        }
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (!categorySlug) {
                    setFilteredItems([]);
                    setCategories([]);
                    setHasMore(false);
                    return;
                }
                // Parallel: full list (for chips) + current category meta (for header) + first page of stores.
                const [categoriesResult, currentCategory, result] = await Promise.all([
                    api.categories.getAll(),
                    api.categories.getBySlug(categorySlug).catch(() => null),
                    api.stores.search({
                        categorySlug,
                        sort: filterOptions.sort,
                        latitude: userCoordinates?.lat,
                        longitude: userCoordinates?.lng,
                        page: 0,
                        limit: 20,
                    }),
                ]);
                setCategories(Array.isArray(categoriesResult) ? categoriesResult : []);
                if (currentCategory) setCategoryInfo(currentCategory);
                setFilteredItems(result.items);
                setHasMore(result.page + 1 < result.totalPages);
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error("Failed to fetch category data:", err);
                setError(err instanceof Error ? err : new Error('Failed to fetch data'));
                setFilteredItems([]);
                setCategories([]);
                setHasMore(false);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categorySlug, userCoordinates, filterOptions.sort]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (!isLoading) {
            const debounceTimer = setTimeout(() => {
                applyFilters();
            }, 300);
            return () => clearTimeout(debounceTimer);
        }
    }, [filterOptions, searchQuery, isLoading, applyFilters]);

    useEffect(() => {
        if (!isIntersecting || !hasMore || isLoading || isLoadingMore || !categorySlug) {
            return;
        }
        const loadMoreItems = async () => {
            setIsLoadingMore(true);
            try {
                const nextPage = page + 1;
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
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error("Failed to load more items:", err);
                setHasMore(false);
            } finally {
                setIsLoadingMore(false);
            }
        };
        loadMoreItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isIntersecting, hasMore, isLoading, isLoadingMore, page, categorySlug, searchQuery, filterOptions, userCoordinates]);

    // State to track mobile filter visibility
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Top Toolbar */}
            <div className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-between">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-700"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-800 dark:text-gray-200"/>
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowMobileFilters(!showMobileFilters)}
                        className="md:hidden p-2 rounded-full bg-gray-100 dark:bg-gray-700"
                    >
                        <Sliders className="w-5 h-5 text-gray-800 dark:text-gray-200"/>
                    </button>
                    <button
                        onClick={handleToggleMap}
                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-700"
                    >
                        <Map className="w-5 h-5 text-gray-800 dark:text-gray-200"/>
                    </button>
                </div>
            </div>

            <div className="flex flex-1">
                {/* Desktop Sidebar Filters */}
                <div
                    id="filter-panel"
                    className={`hidden md:block w-72 bg-white dark:bg-gray-800 shadow-sm ${showMap ? '' : 'lg:block'}`}
                >
                    <div className="sticky top-[72px]">
                        <CategoryFilter
                            options={filterOptions}
                            onChange={setFilterOptions}
                            onReset={resetFilters}
                            userLocation={!!userCoordinates}
                        />
                    </div>
                </div>

                {/* Main Content */}
                <div className={`flex-1 p-4 ${showMap ? 'w-[70%]' : 'w-full'}`}>
                    <div className="max-w-7xl mx-auto">
                        {/* Category heading */}
                        {/* Category Items */}
                        <section id="category-items" className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">
                                    {t("categories", "categoryItems")}
                                </h2>
                            </div>

                            {isLoading ? (
                                <BoxesSkeleton count={8}/>
                            ) : error ? (
                                <EmptyState message={t("common", "error")}/>
                            ) : filteredItems.length > 0 ? (
                                <>
                                    {showMap ? (
                                        <CategoryMap
                                            restaurants={filteredItems}
                                            userCoordinates={userCoordinates}
                                        />
                                    ) : (
                                        <div
                                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {filteredItems.map((item) => (
                                                <CategoryCard
                                                    key={item.id}
                                                    restaurant={item}
                                                    userCoordinates={userCoordinates}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Load More Section */}
                                    {hasMore && !showMap && (
                                        <div
                                            ref={loadMoreRef}
                                            className="flex justify-center mt-6"
                                        >
                                            {isLoadingMore ? (
                                                <p className="text-muted-foreground">{t("categories", "loadingMore")}</p>
                                            ) : (
                                                <Button
                                                    onClick={() => {
                                                        if (hasMore && !isLoadingMore) {
                                                            const nextPage = page + 1;
                                                            setPage(nextPage);
                                                        }
                                                    }}
                                                    className="px-6"
                                                >
                                                    {t("categories", "loadMore")}
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {/* Loading indicator for infinite scroll */}
                                    {isLoadingMore && (
                                        <div className="mt-6">
                                            <BoxesSkeleton count={4}/>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <EmptyState
                                    message={t("categories", "noItemsFound")}
                                    actionButton={
                                        <Button onClick={resetFilters}>
                                            {t("categories", "resetFilters")}
                                        </Button>
                                    }
                                />
                            )}
                        </section>
                    </div>
                </div>

                {/* Map View (Desktop) */}
                {showMap && (
                    <div className="hidden md:block w-[30%] bg-gray-100 dark:bg-gray-800">
                        <div className="sticky top-[72px] h-[calc(100vh-72px)]">
                            <div className="h-full p-2">
                                {userCoordinates ? (
                                    filteredItems.length > 0 ? (
                                        <CategoryMap
                                            restaurants={filteredItems.filter(r =>
                                                r.coordinates &&
                                                typeof r.coordinates.lat !== 'undefined' &&
                                                typeof r.coordinates.lng !== 'undefined' &&
                                                !isNaN(Number(r.coordinates.lat)) &&
                                                !isNaN(Number(r.coordinates.lng))
                                            )}
                                            userCoordinates={userCoordinates}
                                        />
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-muted-foreground">
                                            <p>{t("categories", "noItemsOnMap")}</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        <p>{t("categories", "waitingForLocation")}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Filter Sheet */}
            {showMobileFilters && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
                    <div
                        className="bg-white dark:bg-gray-800 h-[70vh] absolute bottom-0 left-0 right-0 rounded-t-xl p-4 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">{t("categories", "filters")}</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowMobileFilters(false)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                     fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                     strokeLinejoin="round" className="lucide lucide-x">
                                    <path d="M18 6 6 18"/>
                                    <path d="m6 6 12 12"/>
                                </svg>
                            </Button>
                        </div>
                        <CategoryFilter
                            options={filterOptions}
                            onChange={setFilterOptions}
                            onReset={() => {
                                resetFilters();
                                setShowMobileFilters(false);
                            }}
                            userLocation={!!userCoordinates}
                        />
                    </div>
                </div>
            )}

            {/* Mobile Map Modal (full screen when active) */}
            {showMap && (
                <div className="md:hidden fixed inset-0 bg-white dark:bg-gray-900 z-50">
                    <div className="h-14 bg-white dark:bg-gray-800 flex items-center justify-between px-4 border-b">
                        <h2 className="font-semibold">{t("categories", "itemsMap")}</h2>
                        <Button variant="ghost" className="p-2" onClick={handleToggleMap}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                 fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                 strokeLinejoin="round" className="lucide lucide-x">
                                <path d="M18 6 6 18"/>
                                <path d="m6 6 12 12"/>
                            </svg>
                        </Button>
                    </div>
                    <div className="h-[calc(100%-56px)]">
                        {userCoordinates ? (
                            filteredItems.length > 0 ? (
                                <CategoryMap
                                    restaurants={filteredItems.filter(r =>
                                        r.coordinates &&
                                        typeof r.coordinates.lat !== 'undefined' &&
                                        typeof r.coordinates.lng !== 'undefined' &&
                                        !isNaN(Number(r.coordinates.lat)) &&
                                        !isNaN(Number(r.coordinates.lng))
                                    )}
                                    userCoordinates={userCoordinates}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                    <p>{t("categories", "noItemsOnMap")}</p>
                                </div>
                            )
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                <p>{t("categories", "waitingForLocation")}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
