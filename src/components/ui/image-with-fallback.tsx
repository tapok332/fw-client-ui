"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { Loader2 } from "lucide-react";

type ImageWithFallbackProps = ImageProps & {
  fallbackSrc?: string;
};

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc = "/images/fallback-image.jpg",
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse">
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
        </div>
      )}
      <Image
        src={error ? fallbackSrc : src}
        alt={alt}
        {...props}
        onLoadingComplete={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
    </div>
  );
}
