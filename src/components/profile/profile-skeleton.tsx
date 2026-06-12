import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-14 w-14 rounded-full" />
      </div>

      {/* Stats Card Skeleton */}
      <Card className="w-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-24 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>

      {/* Order Again Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-36" />
        <div className="flex space-x-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0">
              <Skeleton className="h-[180px] w-[140px] rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      {/* List Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <Card>
          <CardContent className="p-0">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="py-4 px-4 border-b border-border last:border-0">
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
