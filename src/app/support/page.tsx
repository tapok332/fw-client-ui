'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, HelpCircle, MessageSquare, Phone } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function SupportPage() {
  const { requireAuth } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({
        title: t("common", "error"),
        description: t("support", "pleaseEnterMessage"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      try {
        setIsSubmitting(false);
        toast({
          title: t("common", "success"),
          description: t("support", "messageSent"),
        });
        setMessage('');
      } catch (error) {
        console.error("Failed to send message:", error);
        setIsSubmitting(false);

        if (error instanceof Error && error.message.includes('Too many failed attempts')) {
          toast({
            title: t("common", "error"),
            description: t("support", "reloadPageToRetry"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("common", "error"),
            description: t("support", "errorSendingMessage"),
            variant: "destructive",
          });
        }
      }
    }, 1000);
  };

  return (
    <div className="container max-w-4xl px-4 py-6 space-y-6">
      <div className="flex items-center mb-4">
        <Link href="/profile" className="mr-2" aria-label={t('common', 'back')}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">{t('profile', 'support')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <span>{t('profile', 'contactSupport')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="message" className="block text-sm font-medium">
                {t('profile', 'howCanWeHelp')}
              </label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('support', 'describeIssue')}
                className="h-32"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('profile', 'sending') : t('profile', 'sendMessage')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            <span>{t('profile', 'faq')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">{t('support', 'faqHowItWorks')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('support', 'faqHowItWorksAnswer')}
            </p>
          </div>
          <Separator />
          <div>
            <h3 className="font-medium">{t('support', 'faqCanCancel')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('support', 'faqCanCancelAnswer')}
            </p>
          </div>
          <Separator />
          <div>
            <h3 className="font-medium">{t('support', 'faqMissPickup')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('support', 'faqMissPickupAnswer')}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center py-4">
        <p className="font-medium mb-2">{t('profile', 'needHelp')}</p>
        <div className="flex items-center justify-center gap-2">
          <Phone className="w-4 h-4" />
          <span>{t('support', 'callUsAt')} +7 800 123 4567</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{t('profile', 'workingHours')}</p>
      </div>
    </div>
  );
}
