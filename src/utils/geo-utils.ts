/**
 * Utility functions for calculating distances between geographic coordinates
 */

/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 - Latitude of first point in degrees
 * @param lon1 - Longitude of first point in degrees
 * @param lat2 - Latitude of second point in degrees
 * @param lon2 - Longitude of second point in degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number | undefined,
    lon2: number | undefined
): number {
  // Earth's radius in kilometers
  const R = 6371;
  
  if (lat2 === undefined || lon2 === undefined) {
    return 0;
  }

  // Convert latitude and longitude from degrees to radians
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return distance;
}

/**
 * Safely calculate distance between coordinates with potential undefined values
 * @param userLat - User latitude
 * @param userLng - User longitude
 * @param restaurantLat - Restaurant latitude (possibly undefined)
 * @param restaurantLng - Restaurant longitude (possibly undefined)
 * @returns Distance in kilometers or null if coordinates are missing
 */
export function safeCalculateDistance(
  userLat: number,
  userLng: number,
  restaurantLat: number | undefined,
  restaurantLng: number | undefined
): number | null {
  // Check if all coordinates are valid numbers
  if (
    typeof userLat === 'number' && 
    typeof userLng === 'number' && 
    typeof restaurantLat === 'number' && 
    typeof restaurantLng === 'number' &&
    !isNaN(userLat) && 
    !isNaN(userLng) && 
    !isNaN(restaurantLat) && 
    !isNaN(restaurantLng)
  ) {
    return calculateDistance(userLat, userLng, restaurantLat, restaurantLng);
  }
  
  // Return null if any coordinate is missing or invalid
  return null;
}

/**
 * Convert degrees to radians
 * @param deg - Angle in degrees
 * @returns Angle in radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format the distance for display
 * @param distance - Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    // If less than 1 km, show in meters
    return `${(distance * 1000).toFixed(0)} м`;
  } else {
    // Otherwise show in kilometers with one decimal place
    return `${distance.toFixed(1)} км`;
  }
}
