
import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  children: React.ReactNode;
}

export interface ListItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode;
  asChild?: boolean;
}

export function List({ children, className, ...props }: ListProps) {
  return (
    <ul 
      className={cn(
        "rounded-xl overflow-hidden border border-border shadow-sm divide-y divide-border", 
        className
      )} 
      {...props}
    >
      {children}
    </ul>
  );
}

export function ListItem({ 
  children, 
  className, 
  asChild = false,
  ...props 
}: ListItemProps) {
  const Comp = asChild ? React.Fragment : "li";
  return (
    <Comp>
      <li 
        className={cn(
          "py-3 px-4 bg-card hover:bg-muted/50 transition-colors", 
          className
        )} 
        {...props}
      >
        {children}
      </li>
    </Comp>
  );
}

interface ChevronItemProps {
  href: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export function ChevronItem({ href, label, description, icon }: ChevronItemProps) {
  return (
    <ListItem asChild>
      <Link 
        href={href} 
        className="flex items-center justify-between min-h-[44px]"
      >
        <div className="flex items-center">
          {icon && <span className="mr-3">{icon}</span>}
          <div>
            <span className="text-foreground">{label}</span>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
      </Link>
    </ListItem>
  );
}