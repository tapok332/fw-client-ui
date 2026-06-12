"use client";

import { useLocale } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Euro } from "lucide-react";
import { useEffect, useState } from "react";

export interface FilterOptions {
  minRating: number;
  maxDistance: number;
  openNow: boolean;
  priceLevel: number[];
  sort: "distance" | "rating" | "priceAsc" | "priceDesc";
}

interface CategoryFilterProps {
  options: FilterOptions;
  onChange: (options: FilterOptions) => void;
  onReset: () => void;
  userLocation: boolean;
}

export function CategoryFilter({
  options,
  onChange,
  onReset,
  userLocation,
}: CategoryFilterProps) {
  const { t } = useLocale();

  // Slider draft state — mirrors the thumb during drag for instant label updates,
  // but commits to the parent (and thus the filter pipeline) only on mouse-up.
  // This prevents an API call per pixel of slider movement.
  const [draftMinRating, setDraftMinRating] = useState(options.minRating);
  const [draftMaxDistance, setDraftMaxDistance] = useState(options.maxDistance);

  // Sync drafts when external resets / programmatic changes update the committed value.
  useEffect(() => { setDraftMinRating(options.minRating); }, [options.minRating]);
  useEffect(() => { setDraftMaxDistance(options.maxDistance); }, [options.maxDistance]);

  const handlePriceLevelChange = (level: number) => {
    const newPriceLevel = [...options.priceLevel];
    const index = newPriceLevel.indexOf(level);
    
    if (index === -1) {
      newPriceLevel.push(level);
    } else {
      newPriceLevel.splice(index, 1);
    }
    
    onChange({
      ...options,
      priceLevel: newPriceLevel,
    });
  };

  const handleSortChange = (sort: FilterOptions["sort"]) => {
    onChange({
      ...options,
      sort,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-md shadow-sm">
      <div className="p-4">
        <div className="hidden md:flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{t("categories", "filters")}</h3>
        </div>
    
        <div className="space-y-5">
          {/* Rating Filter */}
          <div className="w-full">
            <Label className="flex items-center justify-between mb-2 font-medium">
              <span>{t("categories", "minRating")}</span>
              <span className="text-foreground tabular-nums">
                {draftMinRating > 0 ? `${draftMinRating}★` : t("common", "all")}
              </span>
            </Label>
            <Slider
              max={5}
              step={0.5}
              value={[draftMinRating]}
              onValueChange={(values) => setDraftMinRating(values[0])}
              onValueCommit={(values) => onChange({ ...options, minRating: values[0] })}
              className="w-full"
            />
            <div className="flex justify-between mt-1 text-sm text-muted-foreground">
              <span>0</span>
              <span>5</span>
            </div>
          </div>

          <Separator />

          {/* Open Now Filter */}
          <div className="flex items-center justify-between py-1">
            <Label htmlFor="open-now" className="font-medium">{t("categories", "openNow")}</Label>
            <Switch
              id="open-now"
              checked={options.openNow}
              onCheckedChange={(checked) => onChange({ ...options, openNow: checked })}
            />
          </div>

          <Separator />

          {/* Price Level Filter */}
          <div className="w-full">
            <Label className="block mb-2 font-medium">{t("categories", "priceLevel")}</Label>
            <div className="flex space-x-2 mt-2">
              {[1, 2, 3, 4].map((level) => (
                <Button
                  key={level}
                  variant={options.priceLevel.includes(level) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePriceLevelChange(level)}
                  className="flex-1"
                >
                  {Array(level).fill('₴').join('')}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Sort Options */}
          <div className="w-full">
            <Label className="block mb-2 font-medium">{t("categories", "sortBy")}</Label>

            {/* Desktop Dropdown */}
            <div className="hidden md:block mt-2">
              <Select
                value={options.sort}
                onValueChange={(value) => handleSortChange(value as FilterOptions["sort"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("categories", "selectSortOption")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">
                    {t("categories", "byRating")}
                  </SelectItem>
                  <SelectItem value="distance" disabled={!userLocation}>
                    {t("categories", "byDistance")}
                  </SelectItem>
                  <SelectItem value="priceAsc">
                    {t("categories", "byPriceAsc")}
                  </SelectItem>
                  <SelectItem value="priceDesc">
                    {t("categories", "byPriceDesc")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-2 md:hidden">
              <Button
                variant={options.sort === "rating" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSortChange("rating")}
              >
                {t("categories", "byRating")}
              </Button>
              <Button
                variant={options.sort === "distance" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSortChange("distance")}
                disabled={!userLocation}
              >
                {t("categories", "byDistance")}
              </Button>
              <Button
                variant={options.sort === "priceAsc" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSortChange("priceAsc")}
              >
                {t("categories", "byPriceAsc")}
              </Button>
              <Button
                variant={options.sort === "priceDesc" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSortChange("priceDesc")}
              >
                {t("categories", "byPriceDesc")}
              </Button>
            </div>
          </div>

          {/* Distance Filter (shown only when location is available) */}
          {userLocation && (
            <>
              <Separator />
              <div className="w-full">
                <Label className="flex items-center justify-between mb-2 font-medium">
                  <span>{t("categories", "maxDistance")}</span>
                  <span className="text-foreground tabular-nums">{draftMaxDistance} {t("common", "kmShort")}</span>
                </Label>
                <Slider
                  className="w-full"
                  max={10}
                  step={0.5}
                  value={[draftMaxDistance]}
                  onValueChange={(values) => setDraftMaxDistance(values[0])}
                  onValueCommit={(values) => onChange({ ...options, maxDistance: values[0] })}
                />
                <div className="flex justify-between mt-1 text-sm text-muted-foreground">
                  <span>0 {t("common", "kmShort")}</span>
                  <span>10 {t("common", "kmShort")}</span>
                </div>
              </div>
            </>
          )}

          <Separator className="my-3" />

          {/* Reset Filters Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={onReset}
          >
            {t("categories", "resetFilters")}
          </Button>
        </div>
      </div>
    </div>
  );
}
