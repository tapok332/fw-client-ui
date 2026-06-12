"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/contexts/locale-context";
import type { LegalDoc } from "@/lib/legal-content";

export function LegalDocument({ content }: { content: Record<string, LegalDoc> }) {
  const { t, language } = useLocale();
  const router = useRouter();
  const doc = content[language] ?? content.uk;

  return (
    <main className="container max-w-3xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t("common", "back", "Назад")}
          className="grid h-9 w-9 place-items-center rounded-full text-foreground transition-colors duration-200 ease-organic hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-serif text-2xl font-bold tracking-tight">{doc.title}</h1>
      </div>

      <p className="text-sm text-muted-foreground tabular-nums">{doc.updated}</p>
      <p className="leading-relaxed text-foreground/90">{doc.intro}</p>

      <div className="space-y-6">
        {doc.sections.map((section, i) => (
          <section key={i} className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-foreground">{section.heading}</h2>
            {section.body.map((paragraph, j) => (
              <p key={j} className="text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft-md">
        <p className="text-sm text-muted-foreground">{doc.contact}</p>
      </div>
    </main>
  );
}
