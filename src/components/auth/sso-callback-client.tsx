"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@meindesk/nextjs";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { hardNavigate, postAuthDestinationPath } from "@/lib/auth-redirect";

const KNOWN_PROVIDERS = new Set([
  "google",
  "github",
  "discord",
  "apple",
  "facebook",
  "microsoft",
]);

interface SsoCallbackClientProps {
  /** Fallback when query has no redirect_url. */
  redirectUrl?: string;
}

export function SsoCallbackClient({
  redirectUrl = "/dashboard",
}: SsoCallbackClientProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { isLoaded, isSignedIn, oauthError } = useAuthContext();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const provider = params.get("provider");
    const queryError =
      params.get("error_description") || params.get("error") || null;
    const destination = postAuthDestinationPath(
      params.get("redirect_url") || redirectUrl,
    );

    if (queryError) {
      setError(queryError);
      return;
    }

    if (oauthError) {
      setError(oauthError);
      return;
    }

    if (isLoaded && isSignedIn) {
      hardNavigate(locale, destination);
      return;
    }

    if (!code || !provider || !KNOWN_PROVIDERS.has(provider)) {
      if (isLoaded && !isSignedIn) {
        const timer = window.setTimeout(() => {
          setError(t("oauthMissingParams"));
        }, 1500);
        return () => window.clearTimeout(timer);
      }
      return;
    }

    if (!isLoaded) return;

    // AuthProvider exchanges code on bootstrap; if that never completes, surface an error.
    const timer = window.setTimeout(() => {
      if (!isSignedIn) {
        setError(t("oauthTimedOut"));
      }
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [isLoaded, isSignedIn, oauthError, redirectUrl, locale, t]);

  if (error) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
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
    <p className="text-center text-sm text-muted-foreground">{t("completingSignIn")}</p>
  );
}
