'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Gift } from 'lucide-react';
import Link from 'next/link';

export default function ActivateCodePage() {
  const { requireAuth } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  const handleActivateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      toast({
        title: t("common", "error"),
        description: t("profile", "pleaseEnterCode"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    // Mock API call
    setTimeout(() => {
      setIsSubmitting(false);
      if (code === "WELCOME50") {
        toast({
          title: t("common", "success"),
          description: t("profile", "codeActivated"),
        });
        setCode('');
      } else {
        toast({
          title: t("common", "error"),
          description: t("profile", "invalidCode"),
          variant: "destructive",
        });
      }
    }, 1000);
  };

  return (
    <div className="max-w-[720px] mx-auto px-4 md:px-6 py-6 space-y-6 pb-[calc(env(safe-area-inset-bottom)+72px)]">
      <div className="flex items-center mb-6">
        <Link href="/profile" className="mr-3" aria-label={t('common', 'back')}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">{t('profile', 'activateCode')}</h1>
      </div>

      <Card>
        <CardHeader className="p-6 md:p-8 pb-2 md:pb-4">
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            <span>{t('profile', 'activateCode')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8 pt-4">
          <form onSubmit={handleActivateCode} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="code" className="block text-sm font-medium">
                {t('profile', 'enterPromoCode')}
              </label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="EXAMPLE123"
                className="uppercase"
              />
            </div>
            <Button
              type="submit"
              className="w-full py-3 text-base rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('profile', 'activating') : t('profile', 'activateButton')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground space-y-4">
        <h2 className="font-medium text-base">{t('profile', 'popularCodes')}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="p-4 border rounded-xl shadow-sm bg-card">
            <p className="font-bold">WELCOME50</p>
            <p className="text-xs mt-1">{t('profile', 'welcomeBonus')}</p>
          </div>
          <div className="p-4 border rounded-xl shadow-sm bg-card">
            <p className="font-bold">SUMMER2024</p>
            <p className="text-xs mt-1">{t('profile', 'summerDiscount')}</p>
          </div>
        </div>
        <p className="pt-4">{t('profile', 'demoHint')}</p>
      </div>
    </div>
  );
}
