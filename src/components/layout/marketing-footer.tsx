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
    <footer className={cn("border-t border-white/10 bg-black/25", className)}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center">
              <Logo variant="full" theme="light" size="md" />
            </Link>
            <p className="mt-4 max-w-[28ch] text-sm leading-relaxed text-white/50">
              {t("heroSubtitle")}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("footerProduct")}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/features"
                  className="text-sm text-white/55 transition-colors hover:text-white"
                >
                  {tNav("features")}
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-white/55 transition-colors hover:text-white"
                >
                  {tNav("pricing")}
                </Link>
              </li>
              <li>
                <Link
                  href="/for-planners"
                  className="text-sm text-white/55 transition-colors hover:text-white"
                >
                  {tNav("forPlanners")}
                </Link>
              </li>
              <li>
                <Link
                  href="/for-businesses"
                  className="text-sm text-white/55 transition-colors hover:text-white"
                >
                  {tNav("forBusinesses")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("footerCompany")}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <span className="text-sm text-white/55">{t("footerAbout")}</span>
              </li>
              <li>
                <span className="text-sm text-white/55">{t("footerBlog")}</span>
              </li>
              <li>
                <span className="text-sm text-white/55">{t("footerContact")}</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("footerLegal")}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <span className="text-sm text-white/55">{t("footerPrivacy")}</span>
              </li>
              <li>
                <span className="text-sm text-white/55">{t("footerTerms")}</span>
              </li>
              <li>
                <span className="text-sm text-white/55">{t("footerCookies")}</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 border-white/10 bg-white/10" />

        <p className="text-center text-sm text-white/40">{t("copyright", { year })}</p>
      </div>
    </footer>
  );
}
