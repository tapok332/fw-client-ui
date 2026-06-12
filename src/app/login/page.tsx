"use client";

import {useState, useEffect, useRef} from "react";
import {useAuth} from "@/contexts/auth-context";
import {useLocale} from "@/contexts/locale-context";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import Link from "next/link";
import {useToast} from "@/hooks/use-toast";
import {Eye, EyeOff, Leaf, Mail as MailIcon, Sprout, TreePine, Recycle} from "lucide-react";
import {motion} from "framer-motion";
import googleLogo from '@/img/google-logo.png';
import Image from "next/image";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type GoogleCredentialResponse = {credential: string};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (callback?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            getNotDisplayedReason: () => string;
            getSkippedReason: () => string;
          }) => void) => void;
        };
      };
    };
  }
}

const GOOGLE_GSI_SRC = "https://accounts.google.com/gsi/client";

const fadeUp = (delay: number) => ({
  initial: {opacity: 0, y: 20},
  animate: {opacity: 1, y: 0},
  transition: {duration: 0.35, delay},
});

const howItWorksIcons = [Sprout, TreePine, Recycle];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {login, loginWithGoogle, isLoading} = useAuth();
  const {toast} = useToast();
  const {t} = useLocale();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  const googleInitialized = useRef(false);

  const howItWorks = [
    {icon: howItWorksIcons[0], title: t("auth", "step1Title"), desc: t("auth", "step1Desc")},
    {icon: howItWorksIcons[1], title: t("auth", "step2Title"), desc: t("auth", "step2Desc")},
    {icon: howItWorksIcons[2], title: t("auth", "step3Title"), desc: t("auth", "step3Desc")},
  ];

  // Prevent page scroll and hide layout header on login
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const header = document.querySelector('header');
    const mobileNav = document.querySelector('nav.fixed.bottom-0');
    if (header) header.style.display = 'none';
    if (mobileNav) (mobileNav as HTMLElement).style.display = 'none';
    return () => {
      document.body.style.overflow = '';
      if (header) header.style.display = '';
      if (mobileNav) (mobileNav as HTMLElement).style.display = '';
    };
  }, []);

  // Load Google Identity Services script and initialize
  useEffect(() => {
    if (!googleClientId) return;

    const initGoogle = () => {
      if (!window.google || googleInitialized.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: GoogleCredentialResponse) => {
          try {
            await loginWithGoogle(response.credential);
            toast({
              title: t("common", "success"),
              description: t("auth", "loginSuccess"),
            });
          } catch (error) {
            toast({
              title: t("auth", "loginError"),
              description: error instanceof Error ? error.message : t("auth", "invalidCredentials"),
              variant: "destructive",
            });
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      googleInitialized.current = true;
    };

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_GSI_SRC}"]`);
    if (existing) {
      initGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
  }, [googleClientId, loginWithGoogle, t, toast]);

  const handleGoogleSignIn = () => {
    if (!googleClientId) {
      toast({
        title: t("auth", "loginError"),
        description: t("auth", "googleSignInNotConfigured"),
        variant: "destructive",
      });
      return;
    }
    if (!window.google || !googleInitialized.current) {
      toast({
        title: t("auth", "loginError"),
        description: t("auth", "googleSignInLoading"),
        variant: "destructive",
      });
      return;
    }
    window.google.accounts.id.prompt();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: t("common", "error"),
        description: t("auth", "fieldRequired"),
        variant: "destructive",
      });
      return;
    }

    try {
      await login({email, password});
      toast({
        title: t("common", "success"),
        description: t("auth", "loginSuccess"),
      });
    } catch (error) {
      toast({
        title: t("auth", "loginError"),
        description: error instanceof Error ? error.message : t("auth", "invalidCredentials"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden fixed inset-0 z-[60] font-[family-name:var(--font-body)]">
      {/* Integrated header — matches main Header layout exactly */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between mx-4 mt-3 px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
          <Leaf className="w-6 h-6 text-foreground lg:text-white drop-shadow-sm" />
          <span className="font-[family-name:var(--font-heading)] text-xl font-bold tracking-tight text-foreground lg:text-white drop-shadow-sm">
            FoodWise
          </span>
        </Link>
        <LanguageSwitcher />
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
      {/* Left decorative panel - hidden on mobile */}
      <motion.div
        initial={{opacity: 0, x: -60}}
        animate={{opacity: 1, x: 0}}
        transition={{duration: 0.7, ease: "easeOut"}}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-green-800 via-emerald-700 to-green-900"
      >
        {/* Leaf pattern overlay */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 C30 5 45 20 45 35 C45 50 30 55 30 55 C30 55 15 50 15 35 C15 20 30 5 30 5Z' fill='%23ffffff' fill-opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Organic blob shapes */}
        <svg className="absolute -top-20 -left-20 w-[500px] h-[500px] opacity-10" viewBox="0 0 500 500">
          <path
            d="M250,50 C350,50 450,150 450,250 C450,350 400,450 300,450 C200,450 50,400 50,300 C50,200 150,50 250,50Z"
            fill="white"
          />
        </svg>
        <svg className="absolute -bottom-32 -right-32 w-[600px] h-[600px] opacity-[0.06]" viewBox="0 0 600 600">
          <path
            d="M300,80 C420,80 520,180 520,300 C520,420 440,520 320,520 C200,520 80,440 80,320 C80,200 180,80 300,80Z"
            fill="white"
          />
        </svg>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 w-full pt-16">
          <motion.h2
            {...fadeUp(0.1)}
            className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6 font-[family-name:var(--font-heading)]"
          >
            {t("auth", "heroTitle1")}
            <br/>
            <span className="text-emerald-300">{t("auth", "heroTitle2")}</span>
          </motion.h2>

          <motion.p
            {...fadeUp(0.15)}
            className="text-emerald-100/80 text-lg mb-12 max-w-md leading-relaxed"
          >
            {t("auth", "heroSubtitle")}
          </motion.p>

          {/* How it works */}
          <div className="flex flex-col gap-5">
            {howItWorks.map((step, i) => (
              <motion.div
                key={i}
                {...fadeUp(0.2 + i * 0.06)}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <step.icon className="w-5 h-5 text-emerald-300"/>
                </div>
                <div>
                  <p className="text-white font-semibold">{step.title}</p>
                  <p className="text-emerald-200/70 text-sm">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-background px-4">
        {/* Subtle mobile leaf background */}
        <div className="lg:hidden absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 8 C40 8 60 28 60 46 C60 64 40 72 40 72 C40 72 20 64 20 46 C20 28 40 8 40 8Z' fill='%2322c55e' fill-opacity='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: "80px 80px",
          }}
        />

        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          transition={{duration: 0.4, delay: 0.2}}
          className="w-full max-w-md mx-auto relative z-10"
        >
          <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(30,60,30,0.08)] max-h-[95vh]">
            {/* Header */}
            <motion.div {...fadeUp(0.05)} className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <Leaf className="w-8 h-8 text-primary"/>
              </div>
            </motion.div>

            <motion.div {...fadeUp(0.1)} className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-heading)]">
                {t("auth", "login")}
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                {t("app", "slogan")}
              </p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-y-5">
              <motion.div {...fadeUp(0.15)} className="relative space-y-2">
                <Label htmlFor="email" className="text-foreground text-sm font-medium">
                  {t("auth", "email")}
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("auth", "emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-12 rounded-xl border-border bg-muted text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-[border-color,box-shadow] duration-200 ease-out"
                  />
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"/>
                </div>
              </motion.div>

              <motion.div {...fadeUp(0.2)} className="space-y-2">
                <Label htmlFor="password" className="text-foreground text-sm font-medium">
                  {t("auth", "password")}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth", "passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl border-border bg-muted text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-[border-color,box-shadow] duration-200 ease-out"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted rounded-lg transition-[color,background-color] duration-200 ease-out"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground/70"/>
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground/70"/>
                    )}
                  </Button>
                </div>
              </motion.div>

              <motion.div {...fadeUp(0.25)}>
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:scale-[1.02] active:scale-[0.98] transition-[color,background-color,transform] duration-200 ease-out shadow-lg shadow-green-900/10"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <svg className="animate-spin w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full"/>
                  )}
                  {isLoading ? t("auth", "loggingIn") : t("auth", "login")}
                </Button>
              </motion.div>
            </form>

            {/* Divider */}
            <motion.div {...fadeUp(0.3)} className="my-6">
              <div className="flex items-center">
                <hr className="flex-1 border-border"/>
                <span className="px-3 text-muted-foreground text-sm">{t("common", "or")}</span>
                <hr className="flex-1 border-border"/>
              </div>
            </motion.div>

            {/* Google sign-in */}
            <motion.div {...fadeUp(0.35)}>
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                variant="outline"
                className="w-full h-12 rounded-xl flex items-center justify-center border-border bg-card text-foreground hover:bg-muted/50 hover:text-foreground hover:scale-[1.01] active:scale-[0.99] transition-[color,background-color,transform] duration-200 ease-out"
              >
                <Image src={googleLogo} alt="Google" width={20} height={20} className="mr-2"/>
                {t("buttons", "signInWithGoogle")}
              </Button>
            </motion.div>

            {/* Register link */}
            <motion.div {...fadeUp(0.4)} className="mt-8 text-center text-sm">
              <p className="text-muted-foreground">
                {t("auth", "noAccount")}{" "}
                <Link
                  href="/register"
                  className="text-primary font-semibold hover:underline transition-colors duration-200"
                >
                  {t("auth", "register")}
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
      </div>{/* close flex flex-1 */}
    </div>
  );
}
