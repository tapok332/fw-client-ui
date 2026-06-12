'use client';

import dynamic from 'next/dynamic';
import {Skeleton} from "@/components/ui/skeleton";

// Define the props interface
interface MarkerProps {
    id: number;
    name: string;
    position: {
        latitude: number;
        longitude: number
    }
}

export interface MobileSideGoogleMapProps {
    markers?: MarkerProps[],
    className?: string
}

// Dynamically import the Google Map component to prevent SSR issues
const DynamicGoogleMap = dynamic(() => import('./GoogleMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full">
            <Skeleton className="w-full h-full rounded-md"/>
        </div>
    )
});

export default function MobileSideGoogleMap({markers, className}: Readonly<MobileSideGoogleMapProps>) {
    return (
        <div className={`absolute inset-0 w-full h-full touch-manipulation ${className || ''}`}>
            <DynamicGoogleMap
                markers={markers}
                desktopMode={false}
            />
        </div>
    );
}
