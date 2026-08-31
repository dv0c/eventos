"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function MarketingHeader({ className }: { className?: string }) {
  const t = useTranslations();
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center">
          <Logo variant="full" size="md" priority />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {tNav("features")}
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {tNav("pricing")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher variant="ghost" />
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/login">{tAuth("signIn")}</Link>
          </Button>
          <Button variant="gold" size="sm" asChild>
            <Link href="/register">{t("common.getStarted")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
