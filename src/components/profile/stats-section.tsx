import { useUtils } from '@/lib/utils-context';
import { useTranslation } from '@/contexts/locale-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function ProfileStatsSection({ statistics }: { 
  statistics: { 
    ordersCompleted?: number;
    itemsSaved?: number;
    savings?: string;
    co2ReducedKg?: string;
  } 
}) {
  const { t } = useTranslation();
  const { formatCurrency, formatCO2Reduction } = useUtils();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile', 'statistics')}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="space-y-1">
          <p className="text-2xl font-bold text-primary">{statistics?.ordersCompleted || 0}</p>
          <p className="text-sm text-muted-foreground">{t('profile', 'ordersCompleted')}</p>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-primary">{statistics?.itemsSaved || 0}</p>
          <p className="text-sm text-muted-foreground">{t('profile', 'itemsSaved')}</p>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-primary">{formatCurrency(statistics?.savings ?? 0)}</p>
          <p className="text-sm text-muted-foreground">{t('profile', 'savings')}</p>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-primary">{formatCO2Reduction(statistics?.co2ReducedKg)}</p>
          <p className="text-sm text-muted-foreground">CO₂ {t('profile', 'saved')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
