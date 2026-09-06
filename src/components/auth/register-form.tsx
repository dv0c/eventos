"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";

const fieldClassName =
  "h-11 rounded-xl border-white/15 bg-black/35 text-base shadow-none backdrop-blur-sm placeholder:text-white/35";

interface RegisterFormProps {
  callbackUrl?: string;
}

export function RegisterForm({ callbackUrl }: RegisterFormProps) {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast.error(tErrors("passwordMismatch"));
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, locale }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error?.message ?? tErrors("generic"));
        setIsLoading(false);
        return;
      }

      toast.success(t("accountCreated"));
      const loginHref = callbackUrl
        ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : "/login";
      router.push(loginHref);
    } catch {
      toast.error(tErrors("networkError"));
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-muted-foreground">
          {t("name")}
        </Label>
        <Input
          id="name"
          name="name"
          required
          autoComplete="name"
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
          className={fieldClassName}
        />
      </div>
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
        disabled={isLoading}
      >
        {isLoading ? t("register") + "..." : t("signUp")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link
          href={
            callbackUrl
              ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
              : "/login"
          }
          className="font-medium text-accent underline-offset-4 hover:underline"
        >
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}
