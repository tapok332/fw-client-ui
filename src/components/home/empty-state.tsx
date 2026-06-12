"use client";

import { Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { useLocale } from "@/contexts/locale-context";
import { ReactNode } from "react";

type EmptyStateProps = {
  message?: string;
  actionButton?: ReactNode;
};

export function EmptyState({ message, actionButton }: EmptyStateProps) {
  const { t } = useLocale();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center py-12 px-6 rounded-2xl bg-white/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"
      >
        <Leaf className="w-8 h-8 text-primary" />
      </motion.div>
      <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-foreground mb-2">
        {message || t("common", "noResults")}
      </h3>
      <p className="text-muted-foreground text-sm text-center">
        {t("common", "tryDifferentSearch")}
      </p>
      {actionButton && <div className="mt-4">{actionButton}</div>}
    </motion.div>
  );
}
