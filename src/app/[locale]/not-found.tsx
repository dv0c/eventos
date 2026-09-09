import { FileQuestion } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function LocaleNotFoundPage() {
  const t = await getTranslations("errors");

  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,162,39,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(139,115,85,0.08),_transparent_50%)]"
      />
      <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <FileQuestion className="h-8 w-8 text-primary" />
      </div>
      <p className="relative text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">
        404
      </p>
      <h1 className="relative mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
        {t("notFound")}
      </h1>
      <p className="relative mt-2 max-w-md text-muted-foreground">{t("notFoundDesc")}</p>
      <Button variant="gold" className="relative mt-6" asChild>
        <Link href="/dashboard">{t("backToDashboard")}</Link>
      </Button>
    </div>
  );
}
