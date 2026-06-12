'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Copy, Share, Users } from 'lucide-react';
import Link from 'next/link';

export default function InvitePage() {
  const { requireAuth } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText("FOODWISE2024")
      .then(() => {
        toast({
          title: t("common", "success"),
          description: t("invite", "referralCopied"),
        });
      })
      .catch(() => {
        toast({
          title: t("common", "error"),
          description: t("invite", "copyFailed"),
          variant: "destructive",
        });
      });
  };

  const handleShareInvite = () => {
    if (navigator.share) {
      navigator.share({
        title: t("invite", "shareTitle"),
        text: t("invite", "shareText"),
        url: 'https://foodwise.app/register?ref=FOODWISE2024',
      }).catch((error) => console.error('Error sharing', error));
    } else {
      toast({
        title: t("common", "error"),
        description: t("invite", "sharingNotSupported"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-4xl px-4 py-6 space-y-6">
      <div className="flex items-center mb-4">
        <Link href="/profile" className="mr-2" aria-label={t('common', 'back')}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">{t('profile', 'inviteFriends')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>{t('invite', 'title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">{t('profile', 'yourReferralCode')}</p>
            <div className="max-w-xs mx-auto p-3 bg-orange-100 rounded-lg flex items-center justify-between">
              <span className="text-xl font-bold tracking-wider">FOODWISE2024</span>
              <Button size="sm" variant="ghost" onClick={handleCopyInviteCode} aria-label={t('common', 'copy')}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <p className="text-center">{t('profile', 'shareWithFriends')}</p>

            <Button className="w-full" onClick={handleShareInvite}>
              <Share className="w-4 h-4 mr-2" />
              {t('profile', 'shareYourInvite')}
            </Button>

            <div className="text-sm text-center text-muted-foreground pt-2">
              <p>{t('profile', 'invitedFriends')}</p>
              <p>{t('profile', 'earnRewards')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('profile', 'howItWorks')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4 list-decimal list-inside">
            <li className="py-2">{t('profile', 'shareCode')}</li>
            <li className="py-2">{t('profile', 'friendSignsUp')}</li>
            <li className="py-2">{t('profile', 'theyGetDiscount')}</li>
            <li className="py-2">{t('profile', 'youGetCredit')}</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
