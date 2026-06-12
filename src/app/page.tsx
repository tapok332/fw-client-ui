"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {motion} from "framer-motion";
import {useLocale} from "@/contexts/locale-context";
import {api} from "@/lib/api";
import {DEFAULT_LOCATION} from "@/lib/config";
import {HeroCarousel} from "@/components/home/hero-carousel";
import {CategoryChips} from "@/components/home/category-chips";
import {BoxesSkeleton} from "@/components/home/boxes-skeleton";
import {EmptyState} from "@/components/home/empty-state";
import {Category, Store, SurpriseBox as ApiSurpriseBox, SurpriseBoxComponent, SurpriseBoxLocation} from "@/types";
import {useData} from "@/contexts/data-context";
import {useUtils} from "@/lib/utils-context";
import {useRouter} from "next/navigation";
import {StoreCard} from "@/components/store/store-card";

/**
 * Convert API SurpriseBox format to Component SurpriseBox format
 * This adapter handles the type differences between the API and component
 */
const adaptBoxForComponent = (apiBox: ApiSurpriseBox): SurpriseBoxComponent => {
    // Transform the location from API format to component format
    // If location is undefined, create a default location object with null coordinates
    const transformedLocation: SurpriseBoxLocation = apiBox.location ? {
        lat: apiBox.location.latitude,
        lng: apiBox.location.longitude
    } : {lat: null, lng: null};

    return {
        id: apiBox.id,
        name: apiBox.name,
        image: apiBox.image,
        discount: apiBox.discount,
        timeLeft: apiBox.timeLeft,
        location: transformedLocation,
        category: apiBox.category,
        price: apiBox.price,
        retailPrice: apiBox.retailPrice,
    };
};

export default function Home() {
    const {t} = useLocale();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [boxes, setBoxes] = useState<SurpriseBoxComponent[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    // Store states
    const [allStores, setAllStores] = useState<Store[]>([]);
    const [featuredStores, setFeaturedStores] = useState<Store[]>([]);
    const [nearbyStores, setNearbyStores] = useState<Store[]>([]);
    const [userCoordinates, setUserCoordinates] = useState<{ lat: number, lng: number }>({lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng});

    // Get shared UI data from utils context
    const utils = useUtils();
    const {heroImages, categoryIcons: categoryIconsData, isLoading: isUtilsLoading} = utils;

    // Get boxes from data context as a fallback
    const {boxes: contextBoxes, isLoading: isContextLoading} = useData();

    // Kyiv coordinates are set as useState default — no need for useEffect

    // Load data from API
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Fetch boxes, categories, and stores in parallel
                // Hero images and category icons are now managed by the utils context
                const [boxesResult, categoriesResult, storesResult] = await Promise.all([
                    api.boxes.getAll(
                        userCoordinates.lat,
                        userCoordinates.lng
                    ),
                    api.categories.getAll(),
                    api.stores.getAll()
                ]);

                // Transform API boxes to component format
                const adaptedBoxes = Array.isArray(boxesResult) ? boxesResult.map(adaptBoxForComponent) : [];

                // Set state with results
                setBoxes(adaptedBoxes);
                setCategories(Array.isArray(categoriesResult) ? categoriesResult : []);
                setAllStores(Array.isArray(storesResult) ? storesResult : []);

                // Get featured stores
                const featured = await api.stores.getFeatured();
                setFeaturedStores(featured);
            } catch (err) {
                console.error("Failed to fetch home data:", err);
                setError(err instanceof Error ? err : new Error('Failed to fetch data'));

                // If we have boxes from context, use those as fallback
                if (contextBoxes.length > 0) {
                    // Make sure context boxes are also adapted to the component format
                    const adaptedContextBoxes = contextBoxes.map((box: any) => adaptBoxForComponent(box));
                    setBoxes(adaptedContextBoxes);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [contextBoxes]);

    // Fetch nearby stores when user coordinates are available and not already loaded from context
    useEffect(() => {
        if (userCoordinates && nearbyStores.length === 0) {
            const fetchNearbyStores = async () => {
                try {
                    const nearby = await api.stores.getNearby(
                        userCoordinates.lat,
                        userCoordinates.lng
                    );
                    setNearbyStores(nearby);
                } catch (err) {
                    console.error("Failed to fetch nearby stores:", err);
                }
            };

            fetchNearbyStores();
        }
    }, [userCoordinates, nearbyStores.length]);


    // Pass Category[] to CategoryChips; slug is the stable identifier (URL + selection).
    const categoryList = categories.filter(cat => cat.slug && cat.slug !== 'all');

    // Icon map keyed by slug. Fallback: iconName from category, then leaf.
    const categoryIcons: Record<string, JSX.Element> = {};
    categoryList.forEach(cat => {
        const iconKey = cat.iconName ?? cat.slug;
        categoryIcons[cat.slug] = categoryIconsData[iconKey] || utils.iconComponentMap["leaf"];
    });

    // Show loading indicator when any of our data sources are loading
    const showLoading = isLoading || isContextLoading || isUtilsLoading;

    return (
        <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
            {/* Organic background decorations */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] opacity-[0.03] pointer-events-none">
                <svg viewBox="0 0 400 400" fill="none">
                    <path d="M200,20 C280,20 380,100 380,200 C380,300 300,380 200,380 C100,380 20,300 20,200 C20,100 120,20 200,20Z" fill="currentColor" className="text-primary"/>
                </svg>
            </div>
            <div className="absolute bottom-20 left-0 w-[300px] h-[300px] opacity-[0.02] pointer-events-none">
                <svg viewBox="0 0 300 300" fill="none">
                    <path d="M150,10 C150,10 250,80 250,170 C250,260 150,290 150,290 C150,290 50,260 50,170 C50,80 150,10 150,10Z" fill="currentColor" className="text-primary"/>
                </svg>
            </div>

            <div className="max-w-7xl mx-auto w-full relative z-10">

                {/* Hero Carousel */}
                <div className="block px-4 sm:px-6 lg:px-8 mt-4 w-full">
                    <HeroCarousel images={heroImages}/>
                </div>

                {/* Category Chips */}
                <div className="py-4 px-4 sm:px-6 lg:px-8">
                    <CategoryChips
                        categories={categoryList}
                        selectedCategory={null}
                        categoryIcons={categoryIcons}
                        showAllCategory={false}
                        isLoading={isLoading}
                        onSelect={(slug) => {
                            if (slug) {
                                router.push(`/category/${slug}`);
                            }
                        }}
                    />
                </div>

                {/* Section: Featured stores */}
                <motion.section
                    id="featuredStores"
                    className="py-6 px-4 sm:px-6 lg:px-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold font-[family-name:var(--font-heading)] flex items-center gap-2">
                            <span className="inline-block w-1 h-6 rounded-full bg-primary" />
                            {t("home", "featuredStores")}
                        </h2>
                        <Link href="/restaurants" className="text-primary">
                            {t("common", "all")}
                        </Link>
                    </div>

                    {showLoading ? (
                        <BoxesSkeleton count={3}/>
                    ) : error ? (
                        <EmptyState message={t("common", "error")}/>
                    ) : featuredStores.length > 0 ? (
                        <div
                            className="mt-4 overflow-x-auto flex space-x-4 scroll-snap-type-x mandatory py-8 -my-4 px-2 -mx-2"
                            role="list"
                            aria-label={t("home", "featuredStores")}
                        >
                            {featuredStores.map((store) => (
                                <div key={store.id} className="scroll-snap-align-start">
                                    <StoreCard store={store}/>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState message={t("home", "noFeaturedStores")}/>
                    )}
                </motion.section>

                {/* Section: Nearby stores */}
                <motion.section
                    id="nearbyStores"
                    className="py-6 px-4 sm:px-6 lg:px-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold font-[family-name:var(--font-heading)] flex items-center gap-2">
                            <span className="inline-block w-1 h-6 rounded-full bg-primary" />
                            {t("home", "nearbyStores")}
                        </h2>
                        <Link href="/restaurants" className="text-primary">
                            {t("common", "all")}
                        </Link>
                    </div>

                    {showLoading ? (
                        <BoxesSkeleton count={3}/>
                    ) : error ? (
                        <EmptyState message={t("common", "error")}/>
                    ) : nearbyStores.length > 0 ? (
                        <div
                            className="mt-4 overflow-x-auto flex space-x-4 scroll-snap-type-x mandatory py-8 -my-4 px-2 -mx-2"
                            role="list"
                            aria-label={t("home", "nearbyStores")}
                        >
                            {nearbyStores.map((store) => (
                                <div key={store.id} className="scroll-snap-align-start">
                                    <StoreCard store={store}/>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState message={t("home", "noNearbyStores")}/>
                    )}
                </motion.section>
            </div>
        </div>
    );
}