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

const TOTAL_STEPS = 2;

interface RegisterFormProps {
  callbackUrl?: string;
}

function splitName(fullName: string): { firstName?: string; lastName?: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function RegisterForm({ callbackUrl }: RegisterFormProps) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const googleCallbackUrl = callbackUrl ?? "/dashboard";
  const loginHref = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/login";
  const afterAuthHref = callbackUrl ?? "/dashboard";

  function handleContinue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error(tErrors("generic"));
      return;
    }
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast.error(tErrors("passwordMismatch"));
      setIsLoading(false);
      return;
    }

    try {
      const { firstName, lastName } = splitName(name);
      await signUp({
        email: email.trim(),
        password,
        firstName,
        lastName,
      });

      toast.success(t("accountCreated"));
      hardNavigate(locale, afterAuthHref);
    } catch (error) {
      const message =
        error instanceof MeindeskApiError ? error.message : tErrors("generic");
      toast.error(message);
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <GoogleAuthButton callbackUrl={googleCallbackUrl} />
      <AuthMethodDivider />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-white/50">
          {t("stepOf", { current: step, total: TOTAL_STEPS })}
        </p>
        <div className="flex gap-1.5" aria-hidden>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span
              key={i}
              className={`h-1 w-6 rounded-full transition-colors ${
                i + 1 <= step ? "bg-accent" : "bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleContinue} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-muted-foreground">
              {t("name")}
            </Label>
            <Input
              id="name"
              name="name"
              required
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClassName}
            />
          </div>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClassName}
            />
          </div>
          <Button
            type="submit"
            variant="gold"
            className="h-11 w-full rounded-xl text-base font-semibold"
          >
            {tCommon("next")}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-muted-foreground">
              {t("password")}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClassName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-muted-foreground">
              {t("confirmPassword")}
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={fieldClassName}
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl border-white/15 bg-transparent text-base"
              onClick={() => setStep(1)}
              disabled={isLoading}
            >
              {tCommon("back")}
            </Button>
            <Button
              type="submit"
              variant="gold"
              className="h-11 flex-[1.4] rounded-xl text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? `${t("register")}...` : t("signUp")}
            </Button>
          </div>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link
          href={loginHref}
          className="font-medium text-accent underline-offset-4 hover:underline"
        >
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
