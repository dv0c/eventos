import { FileQuestion } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { MarketingShell } from "@/components/layout/marketing-shell";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function LocaleNotFoundPage() {
  const t = await getTranslations("errors");

  return (
    <MarketingShell>
      <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <FileQuestion className="h-8 w-8 text-primary" />
        </div>
        <p className="relative text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">
          404
        </p>
        <h1 className="relative mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {t("notFound")}
        </h1>
        <p className="relative mt-2 max-w-md text-muted-foreground">
          {t("notFoundDesc")}
        </p>
        <Button variant="gold" className="relative mt-6" asChild>
          <Link href="/">{t("backHome")}</Link>
        </Button>
      </div>
    </MarketingShell>
  );
}
