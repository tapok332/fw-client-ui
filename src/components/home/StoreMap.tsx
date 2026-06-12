"use client";

import { useEffect, useRef, useState } from "react";
import { Store } from "@/types";
import { useLocale } from "@/contexts/locale-context";
import { mapLoader } from "@/lib/map-loader";

interface StoreMapProps {
  stores: Store[];
  userCoordinates: { lat: number, lng: number } | null;
}

export const StoreMap = ({ stores, userCoordinates }: StoreMapProps) => {
  const { t } = useLocale();
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Filter stores to only include those with valid coordinates
  const validStores = stores.filter(store => 
    store.coordinates && 
    typeof store.coordinates.lat !== 'undefined' && 
    typeof store.coordinates.lng !== 'undefined' &&
    !isNaN(Number(store.coordinates.lat)) &&
    !isNaN(Number(store.coordinates.lng))
  );

  useEffect(() => {
    // Use the shared map loader instead of direct script injection
    const loadGoogleMaps = async () => {
      try {
        await mapLoader.load();
        setMapLoaded(true);
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    // If Google Maps is already loaded, set mapLoaded to true
    if (mapLoader.isMapLoaded()) {
      setMapLoaded(true);
    } else {
      loadGoogleMaps();
    }
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !userCoordinates) return;

    // Create map centered on user's location
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: userCoordinates.lat, lng: userCoordinates.lng },
      zoom: 13,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    // Add user marker
    new google.maps.Marker({
      position: { lat: userCoordinates.lat, lng: userCoordinates.lng },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2
      },
      title: t("home", "yourLocation")
    });

    // Add markers for stores with valid coordinates
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(new google.maps.LatLng(userCoordinates.lat, userCoordinates.lng));

    validStores.forEach(store => {
      if (store.coordinates && store.coordinates.lat && store.coordinates.lng) {
        const marker = new google.maps.Marker({
          position: { 
            lat: Number(store.coordinates.lat), 
            lng: Number(store.coordinates.lng) 
          },
          map,
          title: store.name,
          icon: {
            url: '/images/marker-restaurant.png',
            scaledSize: new google.maps.Size(32, 32)
          }
        });

        // Add info window for each store
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 200px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${store.name}</div>
              <div>${store.address || ''}</div>
              <div style="margin-top: 4px;">Rating: ${store.rating.toFixed(1)}</div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        bounds.extend(new google.maps.LatLng(
          Number(store.coordinates.lat), 
          Number(store.coordinates.lng)
        ));
      }
    });

    // Fit map to show all markers
    if (validStores.length > 0) {
      map.fitBounds(bounds);
      
      // Don't zoom in too far
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if ((map.getZoom() ?? 0) > 15) map.setZoom(15);
        google.maps.event.removeListener(listener);
      });
    }
  }, [mapLoaded, validStores, userCoordinates, t]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-lg">
          {t("home", "nearbyStoresMap")}
        </h3>
      </div>
      {userCoordinates ? (
        <div 
          ref={mapRef} 
          className="w-full h-[300px] lg:h-[400px]"
          aria-label={t("home", "mapOfNearbyStores")}
        ></div>
      ) : (
        <div className="w-full h-[300px] lg:h-[400px] flex items-center justify-center">
          <p>{t("home", "loadingLocation")}</p>
        </div>
      )}
    </div>
  );
};
