// Default geographic location used when user geolocation is unavailable or denied.
// Configurable via NEXT_PUBLIC_DEFAULT_LAT / NEXT_PUBLIC_DEFAULT_LNG env vars
// (NEXT_PUBLIC_* prefix is required for client-side access in Next.js).
// Fallback values target Kyiv center.

const parseCoordinate = (raw: string | undefined, fallback: number): number => {
    if (!raw) return fallback;
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const DEFAULT_LOCATION = {
    lat: parseCoordinate(process.env.NEXT_PUBLIC_DEFAULT_LAT, 50.4501),
    lng: parseCoordinate(process.env.NEXT_PUBLIC_DEFAULT_LNG, 30.5234),
} as const;

// Convenience aliases for callers that prefer {latitude, longitude}.
export const DEFAULT_LOCATION_LATLNG = {
    latitude: DEFAULT_LOCATION.lat,
    longitude: DEFAULT_LOCATION.lng,
} as const;
