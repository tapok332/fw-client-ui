"use client";

import {useEffect, useState} from "react";
import {Map, Search} from "lucide-react";
import {useLocale} from "@/contexts/locale-context";
import {api} from "@/lib/api";
import {DEFAULT_LOCATION} from "@/lib/config";
import {CategoryChips} from "@/components/home/category-chips";
import {BoxesSkeleton} from "@/components/home/boxes-skeleton";
import {EmptyState} from "@/components/home/empty-state";
import {Category, Store} from "@/types";
import {useUtils} from "@/lib/utils-context";
import {Button} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";
import {Switch} from "@/components/ui/switch";
import {Slider} from "@/components/ui/slider";
import {Label} from "@/components/ui/label";
import {useRouter} from "next/navigation";
import {RestaurantMap} from "@/components/restaurants/RestaurantMap";
import {CategoryCard} from "@/components/category/category-card";

// /stores — RETAIL venues (GROCERY, SWEETS, OTHER). Does NOT include RESTAURANT/CAFE/BAKERY
// (those are /restaurants). The group is defined by StoreType.group(); the frontend passes group=RETAIL.
export default function StoresPage() {
    const {t} = useLocale();
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const [filteredStores, setFilteredStores] = useState<Store[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [userCoordinates, setUserCoordinates] = useState<{ lat: number, lng: number } | null>(null);

    const [minRating, setMinRating] = useState<number>(0);
    const [draftMinRating, setDraftMinRating] = useState<number>(0);
    const [maxDistance, setMaxDistance] = useState<number>(10);
    const [draftMaxDistance, setDraftMaxDistance] = useState<number>(10);
    const [openNow, setOpenNow] = useState<boolean>(false);
    const [showMap, setShowMap] = useState<boolean>(false);
    const [page, setPage] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

    const utils = useUtils();
    const {categoryIcons: categoryIconsData, isLoading: isUtilsLoading} = utils;

    const handleToggleMap = () => {
        setShowMap(!showMap);
    };

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserCoordinates({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Error getting geolocation:", error);
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
                const [categoriesResult, result] = await Promise.all([
                    api.categories.getAll({ group: 'RETAIL' }),
                    api.stores.search({
                        group: 'RETAIL',
                        latitude: userCoordinates?.lat,
                        longitude: userCoordinates?.lng,
                        sort: "rating",
                        page: 0,
                        limit: 20,
                    }),
                ]);
                setCategories(Array.isArray(categoriesResult) ? categoriesResult : []);
                setFilteredStores(result.items);
                setPage(0);
                setHasMore(result.page + 1 < result.totalPages);
            } catch (err) {
                console.error("Failed to fetch store data:", err);
                setError(err instanceof Error ? err : new Error('Failed to fetch data'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [userCoordinates]);

    useEffect(() => {
        const applyFilters = async () => {
            try {
                const result = await api.stores.search({
                    group: 'RETAIL',
                    categorySlug: selectedCategory ?? undefined,
                    minRating: minRating > 0 ? minRating : undefined,
                    maxDistance: maxDistance < 10 ? maxDistance : undefined,
                    openNow: openNow || undefined,
                    latitude: userCoordinates?.lat,
                    longitude: userCoordinates?.lng,
                    sort: "rating",
                    page: 0,
                    limit: 20,
                });
                setFilteredStores(result.items);
                setPage(0);
                setHasMore(result.page + 1 < result.totalPages);
            } catch (err) {
                console.error("Failed to filter stores:", err);
            }
        };
        const t = setTimeout(applyFilters, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, minRating, maxDistance, openNow]);

    const loadMoreStores = async () => {
        if (!hasMore || isLoadingMore) return;
        const nextPage = page + 1;
        setIsLoadingMore(true);
        try {
            const result = await api.stores.search({
                group: 'RETAIL',
                categorySlug: selectedCategory ?? undefined,
                minRating: minRating > 0 ? minRating : undefined,
                maxDistance: maxDistance < 10 ? maxDistance : undefined,
                openNow: openNow || undefined,
                latitude: userCoordinates?.lat,
                longitude: userCoordinates?.lng,
                sort: "rating",
                page: nextPage,
                limit: 20,
            });
            if (result.items.length > 0) {
                setFilteredStores(prev => [...prev, ...result.items]);
                setPage(nextPage);
                setHasMore(result.page + 1 < result.totalPages);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error("Failed to load more stores:", err);
            setError(err instanceof Error ? err : new Error('Failed to fetch more data'));
        } finally {
            setIsLoadingMore(false);
        }
    };

    const categoryList = categories.filter(cat => cat.slug);

    const categoryIcons: Record<string, JSX.Element> = {};
    categoryList.forEach(cat => {
        const iconKey = cat.iconName ?? cat.slug;
        categoryIcons[cat.slug] = categoryIconsData[iconKey] || utils.iconComponentMap["leaf"];
    });

    const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const showLoading = isLoading || isUtilsLoading;

    const handleResetFilters = () => {
        setSelectedCategory(null);
        setMinRating(0);
        setDraftMinRating(0);
        setMaxDistance(10);
        setDraftMaxDistance(10);
        setOpenNow(false);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 shadow-sm p-4">
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md px-3 py-2">
                    <Search className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2"/>
                    <input
                        type="text"
                        placeholder={t("restaurants", "searchPlaceholder")}
                        className="flex-1 bg-transparent outline-none text-sm dark:text-gray-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label={t("common", "search")}
                    />
                </div>
            </div>
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
                <div
                    className="overflow-x-auto py-2 px-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <CategoryChips
                        categories={categoryList}
                        selectedCategory={selectedCategory}
                        categoryIcons={categoryIcons}
                        showAllCategory={true}
                        onSelect={(slug) => setSelectedCategory(slug)}
                    />
                </div>
            </div>

            <div className="flex flex-1">
                <div
                    className={`hidden md:block w-64 bg-white dark:bg-gray-800 p-4 shadow-sm ${showMap ? '' : 'lg:block'}`}>
                    <div className="sticky top-[144px]">
                        <h3 className="font-semibold text-lg mb-4">{t("restaurants", "filters")}</h3>

                        <div className="space-y-5">
                            <div>
                                <Label
                                    className="flex items-center justify-between mb-2">
                                    <span>{t("restaurants", "minRating")}</span>
                                    <span className="font-medium text-foreground tabular-nums">
                                        {draftMinRating > 0 ? `${draftMinRating}★` : (t("common", "all"))}
                                    </span>
                                </Label>
                                <Slider
                                    max={5}
                                    step={0.5}
                                    value={[draftMinRating]}
                                    onValueChange={(values) => setDraftMinRating(values[0])}
                                    onValueCommit={(values) => setMinRating(values[0])}
                                />
                                <div className="flex justify-between mt-1 text-sm text-muted-foreground">
                                    <span>0</span>
                                    <span>5</span>
                                </div>
                            </div>

                            <Separator/>

                            <div className="flex items-center justify-between">
                                <Label htmlFor="open-now">{t("restaurants", "openNow")}</Label>
                                <Switch
                                    id="open-now"
                                    checked={openNow}
                                    onCheckedChange={setOpenNow}
                                />
                            </div>

                            <Separator/>

                            {userCoordinates && (
                                <div>
                                    <Label
                                        className="flex items-center justify-between mb-2">
                                        <span>{t("restaurants", "maxDistance")}</span>
                                        <span className="font-medium text-foreground tabular-nums">{draftMaxDistance} {t("common", "kmShort")}</span>
                                    </Label>
                                    <Slider
                                        max={10}
                                        step={0.5}
                                        value={[draftMaxDistance]}
                                        onValueChange={(values) => setDraftMaxDistance(values[0])}
                                        onValueCommit={(values) => setMaxDistance(values[0])}
                                    />
                                    <div className="flex justify-between mt-1 text-sm text-muted-foreground">
                                        <span>0 {t("common", "kmShort")}</span>
                                        <span>10 {t("common", "kmShort")}</span>
                                    </div>
                                    <Separator className="mt-5"/>
                                </div>
                            )}

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleResetFilters}
                            >
                                {t("restaurants", "resetFilters")}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className={`flex-1 p-4 ${showMap ? 'w-[70%]' : 'w-full'}`}>
                    <div className="max-w-7xl mx-auto">
                        <div className="hidden md:flex justify-end mb-4">
                            <Button
                                variant={showMap ? "default" : "outline"}
                                onClick={handleToggleMap}
                                className="gap-2"
                            >
                                <Map className="w-4 h-4"/>
                                {showMap ? t("restaurants", "hideMap") : t("restaurants", "showMap")}
                            </Button>
                        </div>

                        <section id="all-stores" className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">
                                    {t("navigation", "stores")}
                                </h2>
                            </div>

                            {showLoading && page === 0 ? (
                                <BoxesSkeleton count={8}/>
                            ) : error ? (
                                <EmptyState message={t("common", "error")}/>
                            ) : filteredStores.length > 0 ? (
                                <>
                                    <div
                                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {filteredStores.map((store) => (
                                            <CategoryCard
                                                key={store.id}
                                                restaurant={store}
                                                userCoordinates={userCoordinates}
                                            />
                                        ))}
                                    </div>

                                    {hasMore && (
                                        <div className="flex justify-center mt-6">
                                            <Button
                                                onClick={loadMoreStores}
                                                disabled={isLoadingMore}
                                                className="px-6"
                                            >
                                                {isLoadingMore ?
                                                    t("common", "loading") :
                                                    t("restaurants", "loadMore")}
                                            </Button>
                                        </div>
                                    )}

                                    {isLoadingMore && (
                                        <div className="mt-6">
                                            <BoxesSkeleton count={4}/>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <EmptyState
                                    message={t("restaurants", "noRestaurantsFound")}
                                    actionButton={
                                        <Button onClick={handleResetFilters}>
                                            {t("restaurants", "resetFilters")}
                                        </Button>
                                    }
                                />
                            )}
                        </section>
                    </div>
                </div>

                {showMap && (
                    <div className="hidden md:block w-[30%] bg-gray-100 dark:bg-gray-800">
                        <div className="sticky top-[144px] h-[calc(100vh-144px)]">
                            <div className="h-full p-2">
                                {userCoordinates ? (
                                    filteredStores.length > 0 ? (
                                        <RestaurantMap
                                            restaurants={filteredStores.filter(s =>
                                                s.coordinates &&
                                                typeof s.coordinates.lat !== 'undefined' &&
                                                typeof s.coordinates.lng !== 'undefined' &&
                                                !isNaN(Number(s.coordinates.lat)) &&
                                                !isNaN(Number(s.coordinates.lng))
                                            )}
                                            userCoordinates={userCoordinates}
                                        />
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-muted-foreground">
                                            <p>{t("restaurants", "noRestaurantsOnMap")}</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        <p>{t("restaurants", "waitingForLocation")}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="md:hidden fixed bottom-20 right-4 z-10">
                <Button
                    onClick={handleToggleMap}
                    className="rounded-full h-14 w-14 shadow-lg flex items-center justify-center"
                >
                    <Map/>
                </Button>
            </div>

            {showMap && (
                <div className="md:hidden fixed inset-0 bg-white dark:bg-gray-900 z-50">
                    <div className="h-14 bg-white dark:bg-gray-800 flex items-center justify-between px-4 border-b">
                        <h2 className="font-semibold">{t("navigation", "stores")}</h2>
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
                            filteredStores.length > 0 ? (
                                <RestaurantMap
                                    restaurants={filteredStores.filter(s =>
                                        s.coordinates &&
                                        typeof s.coordinates.lat !== 'undefined' &&
                                        typeof s.coordinates.lng !== 'undefined' &&
                                        !isNaN(Number(s.coordinates.lat)) &&
                                        !isNaN(Number(s.coordinates.lng))
                                    )}
                                    userCoordinates={userCoordinates}
                                    onRestaurantSelect={(store) => {
                                        setShowMap(false);
                                        router.push(`/stores/${store.id}`);
                                    }}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                    <p>{t("restaurants", "noRestaurantsOnMap")}</p>
                                </div>
                            )
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                <p>{t("restaurants", "waitingForLocation")}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
