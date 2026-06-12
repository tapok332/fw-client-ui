"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { DEFAULT_LOCATION } from '@/lib/config';
import { Store } from '@/types';

interface MapContextType {
  userCoordinates: { lat: number; lng: number } | null;
  isLoadingLocation: boolean;
  nearbyStores: Store[];
  isLoadingStores: boolean;
  locationError: string | null;
}

const defaultCoordinates = { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng };

const MapContext = createContext<MapContextType>({
  userCoordinates: null,
  isLoadingLocation: true,
  nearbyStores: [],
  isLoadingStores: true,
  locationError: null
});

export const useMapContext = () => useContext(MapContext);

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [nearbyStores, setNearbyStores] = useState<Store[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Always use Kyiv as the location
  useEffect(() => {
    // Always use Kyiv coordinates instead of getting user's real location
    setUserCoordinates(defaultCoordinates);
    setIsLoadingLocation(false);
    fetchNearbyStores(defaultCoordinates);
  }, []);

  // Fetch nearby stores based on coordinates
  const fetchNearbyStores = async (coordinates: { lat: number; lng: number }) => {
    setIsLoadingStores(true);
    try {
      const stores = await api.stores.getNearby(coordinates.lat, coordinates.lng);
      setNearbyStores(stores);
    } catch (error) {
      console.error("Failed to fetch nearby stores:", error);
    } finally {
      setIsLoadingStores(false);
    }
  };

  const value = {
    userCoordinates,
    isLoadingLocation,
    nearbyStores,
    isLoadingStores,
    locationError
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};
