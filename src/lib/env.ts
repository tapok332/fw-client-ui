// Environment variables with default values for development
const env = {
  // Google Maps API Key — empty fallback so missing-key check (`!env.X`) triggers
  // the friendly fallback UI instead of sending the placeholder string to Google.
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  
  // API base URL
  API_BASE_URL: process.env.API_BASE_URL ?? "http://localhost:8080",
  
  // Other environment variables can be added here
  NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: "a08e4d2c1ea3d01c1b657b12"
};

export default env;
