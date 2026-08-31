import { ShieldX } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function ForbiddenPage() {
  const t = await getTranslations("forbidden");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <ShieldX className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{t("description")}</p>
      <Button variant="gold" className="mt-6" asChild>
        <Link href="/dashboard">{t("backToDashboard")}</Link>
      </Button>
    </div>
  );
}
