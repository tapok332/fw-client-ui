"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { useLocale } from "@/contexts/locale-context";

type HeroImageKey = {
  id: number;
  key: string;
  url: string;
  icon?: string;
};

type HeroCarouselProps = {
  images: HeroImageKey[];
};

export function HeroCarousel({ images = [] }: HeroCarouselProps) {
  const { t } = useLocale();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Default images from Picsum Photos to use if no images are provided
  const defaultImages: HeroImageKey[] = [
    {
      id: 1,
      key: "food1",
      url: "https://picsum.photos/id/292/1200/800", // Food image
    },
    {
      id: 2,
      key: "food2",
      url: "https://picsum.photos/id/431/1200/800", // Restaurant image
    },
    {
      id: 3,
      key: "food3",
      url: "https://picsum.photos/id/429/1200/800", // Another food image
    },
  ];

  // Use default images if none are provided
  const carouselImages = images && images.length > 0 ? images : defaultImages;
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };
  
  // Handle automatic slide transition with interval
  useEffect(() => {
    // Clear previous interval if exists
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, 5000);
    }
  
    // Cleanup on component unmount or when isPaused changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, carouselImages.length]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === "ArrowRight") {
        nextSlide();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Each slide cycles one of the three brand pillars as its headline.
  const pillars = [t("home", "saveFood"), t("home", "saveMoney"), t("home", "savePlanet")];

  return (
    <div
      role="region"
      aria-label={t("home", "promotionalCarousel")}
      aria-live="polite"
      className="relative w-full h-48 sm:h-64 md:h-96 rounded-3xl overflow-hidden shadow-soft-md"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStartX.current !== null) {
          const diff = e.changedTouches[0].clientX - touchStartX.current;
          if (diff > 50) prevSlide();
          else if (diff < -50) nextSlide();
        }
        touchStartX.current = null;
      }}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentSlide}
          className="absolute inset-0"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          style={{ willChange: "transform, opacity" }}
        >
          <ImageWithFallback
            src={carouselImages[currentSlide]?.url || '/images/placeholder.jpg'}
            alt={`${t("home", "promotionalCarousel")} - ${currentSlide + 1}`}
            fill
            priority
            fallbackSrc="/images/placeholder.jpg"
            className="object-cover w-full h-full"
          />
          {/* Bottom→top scrim keeps the lower band legible */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(15,30,18,0) 0%, rgba(15,30,18,0) 30%, rgba(15,30,18,0.55) 65%, rgba(15,30,18,0.95) 100%)" }}
          />
          {/* Left-side scrim darkens the headline column */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(90deg, rgba(15,30,18,0.55) 0%, rgba(15,30,18,0.15) 55%, rgba(15,30,18,0) 100%)" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Decorative floating leaf — brand motif */}
      <Leaf
        aria-hidden="true"
        strokeWidth={1}
        className="float-leaf pointer-events-none absolute top-4 right-5 h-12 w-12 md:h-16 md:w-16 text-white/15"
      />

      {/* "Today" promo badge — top-left */}
      <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white shadow-[0_4px_14px_hsla(32,90%,55%,0.4)]">
        <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.3)]" />
        {t("home", "heroBadge")}
      </div>

      {/* Editorial headline block — bottom-left */}
      <motion.div
        key={`content-${currentSlide}`}
        className="absolute inset-x-5 bottom-9 md:bottom-12 z-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      >
        <p
          className="mb-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.12em]"
          style={{ color: "hsl(40 60% 88% / 0.9)" }}
        >
          {t("home", "heroEyebrow")}
        </p>
        <h1
          className="font-serif font-bold text-2xl sm:text-3xl md:text-5xl text-white leading-[1.05] tracking-tight max-w-[16ch]"
          style={{ textShadow: "0 2px 18px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.6)" }}
        >
          {pillars[currentSlide % pillars.length]}
        </h1>
        <Button asChild size="lg" className="mt-4 rounded-xl shadow-cta">
          <Link href="/restaurants" className="inline-flex items-center gap-2">
            {t("common", "exploreBoxes")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </motion.div>

      {/* Progress dots — bottom-center */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
        {carouselImages.filter(image => image !== undefined).map((image, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`${t("home", "promotionalCarousel")} ${idx + 1}`}
            aria-current={idx === currentSlide}
            className="flex items-center justify-center h-6 px-0.5 cursor-pointer"
          >
            <span className={`block rounded-full transition-all duration-300 ease-organic ${
              idx === currentSlide
                ? "w-6 h-1.5 bg-primary"
                : "w-1.5 h-1.5 bg-white/45 hover:bg-white/70"
            }`} />
            {image?.icon && <span className="sr-only">{image.icon}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
