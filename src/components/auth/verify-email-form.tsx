"use client";

import { useEffect, useState } from "react";
import { MeindeskApiError, useAuthContext } from "@meindesk/nextjs";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

interface VerifyEmailFormProps {
  token: string;
}

export function VerifyEmailForm({ token }: VerifyEmailFormProps) {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const { client, isLoaded } = useAuthContext();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !token) {
      if (isLoaded && !token) {
        setStatus("error");
        setErrorMessage(t("invalidVerifyToken"));
      }
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        await client.verifyEmail(token);
        if (!cancelled) setStatus("success");
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          error instanceof MeindeskApiError ? error.message : tErrors("generic"),
        );
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [client, isLoaded, token, t, tErrors]);

  if (status === "loading") {
    return <p className="text-center text-sm text-muted-foreground">{t("verifyingEmail")}</p>;
  }

  if (status === "success") {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">{t("emailVerified")}</p>
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
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">
        {errorMessage ?? t("invalidVerifyToken")}
      </p>
      <Link
        href="/login"
        className="font-medium text-accent underline-offset-4 hover:underline"
      >
        {t("signIn")}
      </Link>
    </div>
  );
}
