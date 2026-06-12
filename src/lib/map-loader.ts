import { Loader } from "@googlemaps/js-api-loader";
import env from "@/lib/env";

// This is a singleton that ensures Google Maps is loaded only once
// All components should use this instead of loading Google Maps directly

type Library = "core" | "maps" | "places" | "geocoding" | "routes" | "marker" | "geometry" | "elevation" | "streetView" | "journeySharing" | "drawing" | "visualization";

interface MapLoaderOptions {
  apiKey?: string;
  version?: string;
  libraries?: Library[];
}

class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private loader: Loader | null = null;
  private loadPromise: Promise<void> | null = null;
  private isLoaded = false;

  private constructor() {}

  public static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  public load(options?: MapLoaderOptions): Promise<void> {
    // If already loaded, return resolved promise
    if (this.isLoaded && window.google?.maps) {
      return Promise.resolve();
    }

    // If loading is in progress, return the existing promise
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Initialize the loader if it doesn't exist
    if (!this.loader) {
      this.loader = new Loader({
        apiKey: options?.apiKey || env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        version: options?.version || "weekly",
        libraries: options?.libraries || ["places", "marker"],
      });
    }

    // Start loading and store the promise
    this.loadPromise = this.loader.load().then(() => {
      this.isLoaded = true;
    });

    return this.loadPromise;
  }

  public isMapLoaded(): boolean {
    return this.isLoaded && !!window.google?.maps;
  }
}

export const mapLoader = GoogleMapsLoader.getInstance();
