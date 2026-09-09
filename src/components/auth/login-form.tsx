"use client";

import { useState } from "react";
import { MeindeskApiError, useAuth } from "@meindesk/nextjs";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  AuthMethodDivider,
  GoogleAuthButton,
} from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { hardNavigate } from "@/lib/auth-redirect";

const fieldClassName =
  "h-11 rounded-xl border-white/15 bg-black/35 text-base shadow-none backdrop-blur-sm placeholder:text-white/35";

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl = "/dashboard" }: LoginFormProps) {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn({ email, password });

      if ("status" in result && result.status === "mfa_required") {
        toast.error(t("mfaRequired"));
        setIsLoading(false);
        return;
      }

      hardNavigate(locale, callbackUrl);
    } catch (error) {
      const message =
        error instanceof MeindeskApiError
          ? error.message
          : t("invalidCredentials");
      toast.error(message || tErrors("generic"));
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <GoogleAuthButton callbackUrl={callbackUrl} />
      <AuthMethodDivider />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-muted-foreground">
            {t("email")}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={fieldClassName}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className="text-muted-foreground">
              {t("password")}
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs text-white/55 transition-colors hover:text-white"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={fieldClassName}
          />
        </div>
        <Button
          type="submit"
          variant="gold"
          className="h-11 w-full rounded-xl text-base font-semibold"
          disabled={isLoading}
        >
          {isLoading ? `${t("login")}...` : t("signIn")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link
          href={
            callbackUrl && callbackUrl !== "/dashboard"
              ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
              : "/register"
          }
          className="font-medium text-accent underline-offset-4 hover:underline"
        >
          {t("signUp")}
        </Link>
      </p>
    </div>
  );
}
