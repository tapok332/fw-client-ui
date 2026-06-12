'use client';

import {useEffect, useRef, useState} from 'react';
import {Loader} from '@googlemaps/js-api-loader';
import {GridAlgorithm, MarkerClusterer} from '@googlemaps/markerclusterer';
import {mapStyles} from '@/lib/map-styles';
import {useLocale} from '@/contexts/locale-context';

interface MarkerProps {
    id: number;
    name: string;
    position: {
        latitude: number;
        longitude: number
    }
}

interface GoogleMapProps {
    markers?: MarkerProps[];
    desktopMode: boolean;
}

export default function GoogleMap({markers = [], desktopMode}: GoogleMapProps) {
    const {t} = useLocale();
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markerClusterer, setMarkerClusterer] = useState<MarkerClusterer | null>(null);

    useEffect(() => {
        const initMap = async () => {
            const loader = new Loader({
                apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
                version: 'weekly',
            });

            const google = await loader.load();

            if (mapRef.current) {
                const mapOptions: google.maps.MapOptions = {
                    center: {lat: 37.7749, lng: -122.4194}, // Default center - San Francisco
                    zoom: 12,
                    mapTypeControl: desktopMode,  // Only show on desktop
                    fullscreenControl: desktopMode, // Only show on desktop
                    streetViewControl: desktopMode, // Only show on desktop
                    zoomControl: true,
                    gestureHandling: desktopMode ? 'cooperative' : 'greedy', // Adjust for device
                    styles: mapStyles, // Apply custom map styles
                    scrollwheel: desktopMode, // Enable scroll wheel zoom on desktop only
                    disableDoubleClickZoom: !desktopMode, // Disable double click zoom on mobile
                };

                const newMap = new google.maps.Map(mapRef.current, mapOptions);
                setMap(newMap);

                // Add markers and create clusterer if we have markers
                if (markers.length > 0) {
                    const googleMarkers = markers.map(marker => {
                        const googleMarker = new google.maps.Marker({
                            position: {
                                lat: marker.position.latitude,
                                lng: marker.position.longitude
                            },
                            map: newMap,
                            title: marker.name,
                            animation: google.maps.Animation.DROP,
                            icon: {
                                path: google.maps.SymbolPath.CIRCLE,
                                fillColor: '#4CAF50',
                                fillOpacity: 0.9,
                                strokeWeight: 2,
                                strokeColor: '#FFFFFF',
                                scale: 8
                            }
                        });

                        // Add info window on marker click
                        const infoWindow = new google.maps.InfoWindow({
                            content: `<div class="p-3 max-w-xs">
                                        <h3 class="font-semibold text-lg">${marker.name}</h3>
                                        <button class="mt-2 bg-green-500 text-white px-3 py-1 rounded text-sm">${t("map", "viewDetails")}</button>
                                      </div>`,
                            maxWidth: 250
                        });

                        googleMarker.addListener('click', () => {
                            infoWindow.open(newMap, googleMarker);
                        });

                        return googleMarker;
                    });

                    // Create a marker clusterer if we have enough markers
                    if (googleMarkers.length > 1) {
                        const newMarkerClusterer = new MarkerClusterer({
                            map: newMap,
                            markers: googleMarkers,
                            algorithm: new GridAlgorithm({
                                gridSize: 60,
                            }),
                            renderer: {
                                render: ({count, position}) =>
                                    new google.maps.Marker({
                                        position,
                                        label: {text: String(count), color: "#fff", fontWeight: "bold"},
                                        icon: {
                                            path: google.maps.SymbolPath.CIRCLE,
                                            fillColor: '#2E7D32',
                                            fillOpacity: 0.9,
                                            strokeWeight: 2,
                                            strokeColor: '#FFFFFF',
                                            scale: count < 10 ? 18 : (count < 100 ? 22 : 28),
                                        },
                                        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
                                    }),
                            },
                        });
                        setMarkerClusterer(newMarkerClusterer);
                    }

                    // Center map to fit all markers
                    if (googleMarkers.length > 0) {
                        const bounds = new google.maps.LatLngBounds();
                        googleMarkers.forEach(marker => {
                            bounds.extend(marker.getPosition()!);
                        });
                        newMap.fitBounds(bounds);
                    }
                }

                // Add UI controls specifically for desktop
                if (desktopMode) {
                    // Add custom controls for desktop mode if needed
                    const locationButton = document.createElement("button");
                    locationButton.textContent = t("map", "panToCurrentLocation");
                    locationButton.classList.add("custom-map-control-button");
                    locationButton.classList.add("bg-white", "shadow-md", "rounded-md", "px-3", "py-2", "text-sm", "m-4");

                    newMap.controls[google.maps.ControlPosition.TOP_RIGHT].push(locationButton);

                    locationButton.addEventListener("click", () => {
                        // Try HTML5 geolocation
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                                (position) => {
                                    const pos = {
                                        lat: position.coords.latitude,
                                        lng: position.coords.longitude,
                                    };
                                    newMap.setCenter(pos);
                                    newMap.setZoom(14);
                                },
                                () => {
                                    console.warn(t("map", "geolocationFailed"));
                                }
                            );
                        } else {
                            console.warn(t("map", "browserDoesntSupportGeolocation"));
                        }
                    });
                }
            }
        };

        initMap();

        return () => {
            // Clean up marker clusterer
            if (markerClusterer) {
                markerClusterer.clearMarkers();
                setMarkerClusterer(null);
            }
            setMap(null);
        };
    }, [markers, desktopMode, t]);

    return <div ref={mapRef} className="w-full h-full"/>;
}