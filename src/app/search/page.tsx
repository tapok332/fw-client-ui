'use client';

import { useTranslation } from '@/contexts/locale-context';

export default function SearchPage() {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">{t('search', 'title')}</h1>
      <p className="text-muted-foreground mt-2">{t('search', 'inDevelopment')}</p>
    </div>
  );
}
