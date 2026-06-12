import {Store} from "@/types";
import {useLocale} from "@/contexts/locale-context";
import {useImageLoader} from "@/hooks/use-image-loader";
import {formatDistance, safeCalculateDistance} from "@/utils/geo-utils";
import Link from "next/link";
import Image from "next/image";
import {MapPin, Star} from "lucide-react";

export const CategoryCard = ({restaurant, userCoordinates}: {
    restaurant: Store,
    userCoordinates?: { lat: number, lng: number } | null
}) => {
    const {t} = useLocale();
    const {src, onError, onLoad} = useImageLoader({
        src: restaurant.logoUrl ?? "",
        fallbackSrc: "/images/placeholder-store.jpg",
    });

    // Import formatDistance and calculateDistance directly

    // Calculate distance on the client only if:
    // 1. We don't have it from the server already
    // 2. We have user coordinates
    // 3. We have restaurant coordinates
    let distance = restaurant.distance;
    if (!distance && userCoordinates && restaurant.coordinates) {
        // Calculate distance in km using our safe function that handles undefined values
        distance = safeCalculateDistance(
            userCoordinates.lat,
            userCoordinates.lng,
            restaurant.coordinates.lat,
            restaurant.coordinates.lng
        );
    }

    return (
        <Link href={`/stores/${restaurant.id}`}>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all hover:translate-y-[-4px] duration-300">
                <div className="relative h-[110px] sm:h-[150px] w-full">
                    <Image
                        src={src}
                        alt={`${t('common', 'storePhotoAlt')} ${restaurant.name}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        onError={onError}
                        onLoad={onLoad}
                    />
                </div>
                <div className="p-4">
                    <h3 className="font-semibold text-base md:text-lg mb-1 truncate">{restaurant.name}</h3>
                    <div className="flex items-center text-sm mb-2">
                        <Star className="w-4 h-4 text-yellow-500 mr-1"/>
                        <span>{restaurant.rating.toFixed(1)}</span>
                        {distance !== undefined && distance !== null && (
                            <>
                                <span className="mx-2">•</span>
                                <span>{formatDistance(distance)}</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0"/>
                        <p className="truncate">{restaurant.address}</p>
                    </div>
                </div>
            </div>
        </Link>
    );
};