"use client";

import {useState} from "react";
import {useAuth} from "@/contexts/auth-context";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card} from "@/components/ui/card";
import Link from "next/link";
import {useToast} from "@/hooks/use-toast";
import {Eye, EyeOff} from "lucide-react";
import {useLocale} from "@/contexts/locale-context";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {register, isLoading} = useAuth();
  const { toast } = useToast();
  const {t} = useLocale();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: t("common", "error"),
        description: t("auth", "fieldRequired"),
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: t("common", "error"),
        description: t("auth", "passwordsDontMatch"),
        variant: "destructive",
      });
      return;
    }

    // Password requirements: 8 characters, 1 uppercase, 1 number, special character is optional but increases strength
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast({
        variant: "destructive",
        title: t("common", "error"),
        description: t("auth", "passwordMinLength"),
      });
      return;
    }

    try {
      await register({
        email,
        password,
        name: name || undefined,
      });
      toast({
        title: t("common", "success"),
        description: t("auth", "loginSuccess"),
      });
    } catch (error) {
      toast({
        title: t("auth", "registrationError"),
        description: error instanceof Error ? error.message : t("auth", "registrationFailed"),
        variant: "destructive",
      });
    }
  };

  return (
      <div className="container flex items-center justify-center min-h-screen py-12">
        <Card className="w-full max-w-md p-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">{t("auth", "register")} - {t("app", "appName")}</h1>
            <p className="text-muted-foreground mt-2">{t("app", "slogan")}</p>
        </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("profile", "name")} ({t("auth", "optional")})</Label>
              <Input
                  id="name"
                  type="text"
                  placeholder={t("profile", "yourName")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
            />
          </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("auth", "email")}</Label>
              <Input
                  id="email"
                  type="email"
                  placeholder={t("auth", "emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth", "password")}</Label>

              {/* Password requirements */}
              <div className="text-xs space-y-2 mb-2">
                <div className="flex justify-between items-center">
                  <span>{t("auth", "passwordRequirements")}</span>

                  {password && (
                      <div className="flex items-center gap-1">
                        <span>{t("auth", "passwordStrength")}:</span>
                        <span
                            className={`font-medium ${
                                password.length === 0
                                    ? "text-muted-foreground/70"
                                    : password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)
                                        ? "text-red-500"
                                        : password.length < 10 || !/[!@#$%^&*]/.test(password)
                                            ? "text-amber-500"
                                            : "text-primary"
                            }`}
                        >
                      {password.length === 0
                          ? "—"
                          : password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)
                              ? t("auth", "passwordWeak")
                              : password.length < 10 || !/[!@#$%^&*]/.test(password)
                                  ? t("auth", "passwordMedium")
                                  : t("auth", "passwordStrong")}
                    </span>
                      </div>
                  )}
                </div>

                <div className="bg-muted h-2 rounded-full overflow-hidden">
                  <div
                      className={`h-full transition-all ${
                          password.length === 0
                              ? "w-0 bg-muted"
                              : password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)
                                  ? "w-1/3 bg-red-500"
                                  : password.length < 10 || !/[!@#$%^&*]/.test(password)
                                      ? "w-2/3 bg-amber-500"
                                      : "w-full bg-primary"
                      }`}
                  />
                </div>

                <ul id="password-requirements" className="space-y-1 mt-2">
                  <li className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${
                      password.length >= 8 ? "bg-primary text-white" : "bg-muted"
                  }`}>
                    {password.length >= 8 ? "✓" : ""}
                  </span>
                    <span className={password.length >= 8 ? "text-primary" : ""}>
                    {t("auth", "passwordRule8Chars")}
                  </span>
                  </li>
                  <li className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${
                      /[A-Z]/.test(password) ? "bg-primary text-white" : "bg-muted"
                  }`}>
                    {/[A-Z]/.test(password) ? "✓" : ""}
                  </span>
                    <span className={/[A-Z]/.test(password) ? "text-primary" : ""}>
                    {t("auth", "passwordRuleUppercase")}
                  </span>
                  </li>
                  <li className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${
                      /\d/.test(password) ? "bg-primary text-white" : "bg-muted"
                  }`}>
                    {/\d/.test(password) ? "✓" : ""}
                  </span>
                    <span className={/\d/.test(password) ? "text-primary" : ""}>
                    {t("auth", "passwordRuleNumber")}
                  </span>
                  </li>
                  <li className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${
                      /[!@#$%^&*]/.test(password) ? "bg-primary text-white" : "bg-muted"
                  }`}>
                    {/[!@#$%^&*]/.test(password) ? "✓" : ""}
                  </span>
                    <span className={/[!@#$%^&*]/.test(password) ? "text-primary" : ""}>
                    {t("auth", "passwordRuleSpecial")}
                  </span>
                  </li>
                </ul>
              </div>

              <div className="relative">
                <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth", "passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    aria-describedby="password-requirements"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t("auth", "hidePassword") : t("auth", "showPassword")}
                >
                  {showPassword ? (
                      <EyeOff className="h-4 w-4"/>
                  ) : (
                      <Eye className="h-4 w-4"/>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth", "confirmPassword")}</Label>
              <div className="relative">
                <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth", "passwordPlaceholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
              </div>
            </div>

            <Button
                type="submit"
                variant="default"
                className="w-full"
                disabled={isLoading}
            >
              {isLoading ? t("auth", "loggingIn") : t("auth", "register")}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              {t("auth", "noAccount")}{" "}
              <Link href="/login" className="text-primary font-medium">
                {t("auth", "login")}
              </Link>
            </p>
          </div>
        </Card>
      </div>
  );
}
