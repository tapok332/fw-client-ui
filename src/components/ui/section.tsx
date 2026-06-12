import React from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Section({ 
  title, 
  description, 
  children, 
  className, 
  ...props 
}: SectionProps) {
  return (
    <div className={cn("mt-8", className)} {...props}>
      <div className="mb-4">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
