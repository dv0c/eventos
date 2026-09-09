"use client";

import { useState } from "react";
import { MeindeskApiError, useAuthContext } from "@meindesk/nextjs";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";

const fieldClassName =
  "h-11 rounded-xl border-white/15 bg-black/35 text-base shadow-none backdrop-blur-sm placeholder:text-white/35";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const { client, isLoaded } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).trim();

    try {
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}${window.location.pathname.replace(/\/forgot-password\/?$/, "/reset-password")}`
          : undefined;
      await client.forgotPassword({ email, redirectUrl });
      setSent(true);
      toast.success(t("passwordResetSent"));
    } catch (error) {
      const message =
        error instanceof MeindeskApiError ? error.message : tErrors("generic");
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-sm text-muted-foreground">{t("passwordResetSent")}</p>
        <Link
          href="/login"
          className="font-medium text-accent underline-offset-4 hover:underline"
        >
          {t("signIn")}
        </Link>
      </div>
    );
  }

  return (
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
      <Button
        type="submit"
        variant="gold"
        className="h-11 w-full rounded-xl text-base font-semibold"
        disabled={isLoading || !isLoaded}
      >
        {isLoading ? `${t("sendResetLink")}...` : t("sendResetLink")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-accent underline-offset-4 hover:underline"
        >
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}
