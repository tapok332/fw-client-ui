"use client";

import {Store} from "@/types";
import {useLocale} from "@/contexts/locale-context";
import {useImageLoader} from "@/hooks/use-image-loader";
import {MapPin, Star} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
export const StoreCard = ({store}: { store: Store }) => {
    const {t} = useLocale();
    const {src, onError, onLoad} = useImageLoader({
        src: store.logoUrl ?? "",
        fallbackSrc: "/images/placeholder-store.jpg",
    });

    return (
        <Link href={`/stores/${store.id}`}>
            <div
                className="w-64 flex-shrink-0 bg-card dark:bg-card rounded-3xl overflow-hidden shadow-soft-md hover:shadow-soft-lg cursor-pointer hover:-translate-y-1 active:scale-[0.98] transition-[transform,box-shadow] duration-200 ease-organic"
                style={{ willChange: "transform" }}
            >
                <div className="relative h-36 w-full">
                    <Image
                        src={src}
                        alt={`${store.name}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        onError={onError}
                        onLoad={onLoad}
                    />
                    {store.rating > 0 && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/90 dark:bg-card/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400"/>
                            <span className="text-xs font-semibold tabular-nums">{store.rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <h3 className="font-semibold text-base mb-1.5 truncate text-foreground">{store.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-primary/60 flex-shrink-0"/>
                        <p className="truncate">{store.address}</p>
                    </div>
                </div>
            </div>
        </Link>
    );
};
