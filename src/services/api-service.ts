import {api} from "@/lib/api";

/**
 * Fetches nearby restaurants based on user coordinates
 * @param userCoordinates - User's current coordinates
 * @returns Array of restaurants sorted by proximity to user
 */
export async function fetchNearbyRestaurants(
  userCoordinates: { lat: number; lng: number } | null
) {
  try {
    if (!userCoordinates) {
      console.warn("No user coordinates provided for nearby restaurants");
      return [];
    }
    
    // Call API to get nearby restaurants with user location for distance calculation
    // Ensure coordinates are properly formatted
    return await api.stores.getNearby(
        userCoordinates.lat,
        userCoordinates.lng
    );
  } catch (error) {
    console.error("Error fetching nearby restaurants:", error);
    return [];
  }
}

/**
 * Fetches restaurants with distances calculated on the server using PostGIS
 * @param userCoordinates - User's current coordinates
 * @returns Array of restaurants with distance calculated by PostGIS
 */
export async function fetchRestaurantsWithDistances(
  userCoordinates: { lat: number; lng: number } | null
) {
  try {
    // If user coordinates aren't available, get restaurants without distances
    if (!userCoordinates) {
      const result = await api.stores.getAll();
      // Ensure we return an array
      return Array.isArray(result) ? result : [];
    }
    
    // Pass user coordinates to the API to calculate distances server-side with PostGIS
    // Transform each store to ensure it has coordinates in the correct format
    const result = await api.stores.getAll(
        userCoordinates.lat,
        userCoordinates.lng
    );
    // Ensure we return an array
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error fetching restaurants with distances:", error);
    return [];
  }
}
