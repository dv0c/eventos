"use client";

import { useTranslations } from "next-intl";

import { Logo } from "@/components/shared/logo";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function MarketingFooter({ className }: { className?: string }) {
  const t = useTranslations("marketing");
  const tNav = useTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "border-t border-border/40 bg-gradient-to-b from-background to-secondary/30",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center">
              <Logo variant="full" size="md" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t("heroSubtitle")}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("footerProduct")}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/features"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {tNav("features")}
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {tNav("pricing")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("footerCompany")}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <span className="text-sm text-muted-foreground">
                  {t("footerAbout")}
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  {t("footerBlog")}
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  {t("footerContact")}
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("footerLegal")}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <span className="text-sm text-muted-foreground">
                  {t("footerPrivacy")}
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  {t("footerTerms")}
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  {t("footerCookies")}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <p className="text-center text-sm text-muted-foreground">
          {t("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
