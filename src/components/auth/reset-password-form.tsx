"use client";

import { useState } from "react";
import { MeindeskApiError, useAuthContext } from "@meindesk/nextjs";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";

const fieldClassName =
  "h-11 rounded-xl border-white/15 bg-black/35 text-base shadow-none backdrop-blur-sm placeholder:text-white/35";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const { client, isLoaded } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast.error(tErrors("passwordMismatch"));
      setIsLoading(false);
      return;
    }

    try {
      await client.resetPassword({ token, password });
      toast.success(t("passwordResetSuccess"));
      router.push("/login");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof MeindeskApiError ? error.message : tErrors("generic");
      toast.error(message);
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">{t("invalidResetToken")}</p>
        <Link
          href="/forgot-password"
          className="font-medium text-accent underline-offset-4 hover:underline"
        >
          {t("forgotPassword")}
        </Link>
      </div>
    );
  }

  return (
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
          className={fieldClassName}
        />
      </div>
      <Button
        type="submit"
        variant="gold"
        className="h-11 w-full rounded-xl text-base font-semibold"
        disabled={isLoading || !isLoaded}
      >
        {isLoading ? `${t("resetPassword")}...` : t("resetPassword")}
      </Button>
    </form>
  );
}
