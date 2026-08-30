"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

const CONSENT_KEY = "eventos-cookie-consent";

export function CookieConsent() {
  const t = useTranslations("privacy");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "essential");
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 p-4 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{t("cookieMessage")}</p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={decline}>
            {t("cookieEssential")}
          </Button>
          <Button variant="gold" size="sm" onClick={accept}>
            {t("cookieAccept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
