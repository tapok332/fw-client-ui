"use client";

import { useEffect, useState, useRef } from "react";
import { MapPinOff } from "lucide-react";
import { Store } from "@/types";
import { useLocale } from "@/contexts/locale-context";
import { DEFAULT_LOCATION } from "@/lib/config";
import { MarkerClusterer, GridAlgorithm } from "@googlemaps/markerclusterer";
import env from "@/lib/env";
import { mapLoader } from "@/lib/map-loader";

interface RestaurantMapProps {
  restaurants: Store[];
  userCoordinates: { lat: number; lng: number } | null;
  onRestaurantSelect?: (restaurant: Store) => void;
}

// Helper function to check if coordinates are valid
function hasValidCoordinates(restaurant: Store): boolean {
  return !!(
    restaurant.coordinates &&
    typeof restaurant.coordinates.lat !== 'undefined' &&
    typeof restaurant.coordinates.lng !== 'undefined' &&
    !isNaN(Number(restaurant.coordinates.lat)) &&
    !isNaN(Number(restaurant.coordinates.lng))
  );
}

// Helper to safely get latitude/longitude with fallbacks
function getLatLng(restaurant: Store): { lat: number, lng: number } | null {
  // If no coordinates at all, return null
  if (!restaurant.coordinates) return null;

  try {
    // Try to get lat/lng from the store's coordinates
    const lat = typeof restaurant.coordinates.lat === 'number'
      ? restaurant.coordinates.lat
      : parseFloat(String(restaurant.coordinates.lat || 0));

    const lng = typeof restaurant.coordinates.lng === 'number'
      ? restaurant.coordinates.lng
      : parseFloat(String(restaurant.coordinates.lng || 0));

    // Check if values are valid numbers
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }

    // Try to get latitude/longitude format (alternative format)
    if (typeof (restaurant.coordinates as any).latitude !== 'undefined' &&
        typeof (restaurant.coordinates as any).longitude !== 'undefined') {

      const latitude = typeof (restaurant.coordinates as any).latitude === 'number'
        ? (restaurant.coordinates as any).latitude
        : parseFloat(String((restaurant.coordinates as any).latitude || 0));

      const longitude = typeof (restaurant.coordinates as any).longitude === 'number'
        ? (restaurant.coordinates as any).longitude
        : parseFloat(String((restaurant.coordinates as any).longitude || 0));

      if (!isNaN(latitude) && !isNaN(longitude)) {
        return { lat: latitude, lng: longitude };
      }
    }

    // No valid coordinates found
    return null;
  } catch (e) {
    console.error("Error parsing coordinates:", e);
    return null;
  }
}

export function RestaurantMap({
  restaurants,
  userCoordinates,
  onRestaurantSelect
}: RestaurantMapProps) {
  const { t } = useLocale();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<boolean>(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [clusterer, setClusterer] = useState<MarkerClusterer | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);

  // Catch Google Maps auth/key failures globally — this is the only public hook
  // the Maps JS API gives us for InvalidKey/RefererNotAllowed.
  useEffect(() => {
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
      console.warn("Google Maps authentication failed (invalid API key or referer).");
      setMapError(true);
    };
    return () => {
      delete (window as unknown as { gm_authFailure?: () => void }).gm_authFailure;
    };
  }, []);

  // Initialize map when the component mounts
  useEffect(() => {
    const initMap = async () => {
      if (!env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        console.warn("Google Maps API key is missing — showing fallback UI.");
        setMapError(true);
        return;
      }

      try {
        await mapLoader.load({
          apiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          libraries: ["places", "marker"]
        });
        setMapLoaded(true);
      } catch (error) {
        console.warn("Failed to load Google Maps:", error);
        setMapError(true);
      }
    };

    if (mapLoader.isMapLoaded()) {
      setMapLoaded(true);
    } else if (!mapLoaded) {
      initMap();
    }
  }, [mapLoaded]);

  // Set up map when mapLoaded changes
  useEffect(() => {
    if (!mapLoaded || map || mapError) return;

    try {
      const center = userCoordinates
        ? { lat: userCoordinates.lat, lng: userCoordinates.lng }
        : { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng };

      if (!mapRef.current) return;

      // mapId and styles are mutually exclusive — when mapId is set, styling is
      // controlled via Google Cloud console. Pass only one.
      const mapId = env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
      const baseOptions: google.maps.MapOptions = {
        center,
        zoom: 12,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      };
      const mapInstance = new google.maps.Map(
        mapRef.current,
        mapId
          ? { ...baseOptions, mapId }
          : {
              ...baseOptions,
              styles: [
                { featureType: "poi.business", stylers: [{ visibility: "off" }] },
                { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
              ],
            }
      );

      setMap(mapInstance);

      // Add user location marker if available
      if (userCoordinates) {
        // Create a custom user location marker element
        const userMarkerEl = document.createElement("div");
        userMarkerEl.style.width = "14px";
        userMarkerEl.style.height = "14px";
        userMarkerEl.style.backgroundColor = "#4285F4";
        userMarkerEl.style.border = "2px solid #ffffff";
        userMarkerEl.style.borderRadius = "50%";

        new google.maps.marker.AdvancedMarkerElement({
          position: { lat: userCoordinates.lat, lng: userCoordinates.lng },
          map: mapInstance,
          title: t("map", "yourLocation"),
          content: userMarkerEl,
        });
      }
    } catch (error) {
      console.warn("Failed to initialize map:", error);
      setMapError(true);
    }
  }, [mapLoaded, map, mapError, userCoordinates, t]);

  // Add restaurant markers when map or restaurants change
  useEffect(() => {
    if (!map) return;

    if (!restaurants.length) {
      return;
    }

    // Remove existing markers and clusterer
    if (markers.length) {
      markers.forEach(marker => {
        // Remove AdvancedMarkerElement from the map
        marker.map = null;
      });
      setMarkers([]);
    }

    if (clusterer) {
      clusterer.clearMarkers();
    }

    // Create new markers for each restaurant
    const newMarkers = restaurants.map(restaurant => {
      try {
        // Skip if no coordinates
        if (!restaurant.coordinates) {
          return null;
        }

        // Skip restaurants that don't pass our validity check
        if (!hasValidCoordinates(restaurant)) {
          return null;
        }

        // Handle different coordinate format possibilities
        let lat: number, lng: number;

        // We're sure coordinates exist and are valid due to hasValidCoordinates check
        if (typeof restaurant.coordinates!.lat !== 'undefined') {
          // Standard format from API
          lat = typeof restaurant.coordinates!.lat === 'number'
            ? restaurant.coordinates!.lat
            : parseFloat(String(restaurant.coordinates!.lat));

          lng = typeof restaurant.coordinates!.lng === 'number'
            ? restaurant.coordinates!.lng
            : parseFloat(String(restaurant.coordinates!.lng));
        } else if (restaurant.coordinates &&
                  typeof (restaurant.coordinates as any).latitude !== 'undefined') {
          // Alternative format that might be used in other parts of the app
          lat = typeof (restaurant.coordinates as any).latitude === 'number'
            ? (restaurant.coordinates as any).latitude
            : parseFloat(String((restaurant.coordinates as any).latitude));

          lng = typeof (restaurant.coordinates as any).longitude === 'number'
            ? (restaurant.coordinates as any).longitude
            : parseFloat(String((restaurant.coordinates as any).longitude));
        } else {
          // This should never happen due to hasValidCoordinates check
          return null;
        }

        if (isNaN(lat) || isNaN(lng)) {
          return null;
        }


        // Create a custom marker icon element for AdvancedMarkerElement
        const markerEl = document.createElement("img");
        markerEl.src = "/images/map-pin-restaurant.svg";
        markerEl.style.width = "32px";
        markerEl.style.height = "32px";

        // Create marker
        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: { lat, lng },
          map,
          title: restaurant.name,
          content: markerEl,
        });

        // Create info window for restaurant
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h3 class="font-semibold">${restaurant.name}</h3>
              <p class="text-sm">${restaurant.address}</p>
              <p class="text-sm">${t('common', 'ratingLabel')}: ${restaurant.rating.toFixed(1)}</p>
            </div>
          `,
        });

        // Add click listener to open info window and call onRestaurantSelect
        marker.addListener("click", () => {
          infoWindow.open(map, marker);
          if (onRestaurantSelect) {
            onRestaurantSelect(restaurant);
          }
        });

        return marker;
      } catch (error) {
        console.error(`Error creating marker for ${restaurant.name}:`, error);
        return null;
      }
    }).filter(Boolean) as google.maps.marker.AdvancedMarkerElement[];

    setMarkers(newMarkers);

    // Set up marker clustering
    if (newMarkers.length > 0) {
      try {
        const newClusterer = new MarkerClusterer({
          map,
          markers: newMarkers,
          algorithm: new GridAlgorithm({ maxDistance: 60 }),
          onClusterClick: (event, cluster) => {
            const bounds = new google.maps.LatLngBounds();
            cluster.markers?.forEach(marker => {
              let position: google.maps.LatLng | google.maps.LatLngLiteral | null = null;
              if ('getPosition' in marker) {
                const pos = marker.getPosition();
                if (pos) {
                  position = pos;
                }
              } else if ('position' in marker) {
                const pos = (marker as any).position;
                if (pos) {
                  position = pos;
                }
              }
              if (position) {
                bounds.extend(position);
              }
            });
            map.fitBounds(bounds);
          }
        });

        setClusterer(newClusterer);

        // Fit bounds to include all markers if we have restaurants
        const bounds = new google.maps.LatLngBounds();

        // Add user location to bounds if available
        if (userCoordinates) {
          bounds.extend(new google.maps.LatLng(userCoordinates.lat, userCoordinates.lng));
        }

        // Add all restaurant markers to bounds
        newMarkers.forEach(marker => {
          const pos = marker.position;
          if (pos) {
            bounds.extend(pos);
          }
        });

        map.fitBounds(bounds);

        // Don't zoom in too far
        const listener = google.maps.event.addListener(map, "idle", () => {
          if (map.getZoom()! > 16) map.setZoom(16);
          google.maps.event.removeListener(listener);
        });
      } catch (error) {
        console.warn("Marker clustering failed:", error);
      }
    }
  }, [map, restaurants, onRestaurantSelect, userCoordinates]);

  if (mapError) {
    return (
      <div className="w-full h-full rounded-lg overflow-hidden">
        <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30 px-6 text-center">
          <MapPinOff className="h-10 w-10 text-muted-foreground mb-3" strokeWidth={1.5}/>
          <p className="font-medium text-foreground mb-1">
            {t("map", "unavailable", "Карта тимчасово недоступна")}
          </p>
          <p className="text-sm text-muted-foreground max-w-xs">
            {t("map", "unavailableHint", "Виберіть заклад зі списку — він покаже всю необхідну інформацію.")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <div id="restaurant-map" ref={mapRef} className="w-full h-full">
        {!mapLoaded && (
          <div className="w-full h-full flex items-center justify-center bg-muted/30">
            <p className="text-muted-foreground text-sm">
              {t("restaurants", "loadingMap", "Завантаження карти...")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
