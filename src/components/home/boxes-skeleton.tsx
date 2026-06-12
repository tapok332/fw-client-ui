"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BoxesSkeletonProps = {
  count?: number;
  className?: string;
};

export function BoxesSkeleton({ count = 3, className }: BoxesSkeletonProps) {
  return (
    <div className={cn("flex space-x-4 overflow-x-auto scrollbar-hide px-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="min-w-[250px] max-w-[300px] animate-pulse">
          <div className="bg-gray-200 dark:bg-gray-700 aspect-square rounded-t-lg" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2" />
            <div className="h-8 mt-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}
