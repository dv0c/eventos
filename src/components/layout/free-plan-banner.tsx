"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useOrg, useOrgPath } from "@/components/providers/org-provider";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function FreePlanBanner() {
  const t = useTranslations("eventWorkspace");
  const { planSlug, orgId } = useOrg();
  const orgPath = useOrgPath;
  const storageKey = `eventos-free-banner-dismissed:${orgId}`;
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(storageKey) === "1");
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  if (planSlug !== "free" || dismissed) {
    return null;
  }

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  }

  return (
    <div className="flex items-center gap-3 border-b border-white/10 bg-black/30 px-4 py-2 text-sm backdrop-blur-md sm:px-6">
      <p className="min-w-0 flex-1 text-muted-foreground">
        <span className="font-medium text-foreground">{t("freePlanLabel")}</span>
        <span className="mx-1.5 text-white/20">·</span>
        {t("freePlanBanner")}
      </p>
      <Button asChild size="sm" variant="glass" className="h-7 shrink-0 px-2.5 text-xs">
        <Link href={orgPath("/billing")}>{t("viewPlans")}</Link>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-white/10 hover:text-foreground"
        onClick={dismiss}
        aria-label={t("dismissBanner")}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
