"use client";

import { useTranslations } from "next-intl";

import { Logo } from "@/components/shared/logo";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function MarketingFooter({ className }: { className?: string }) {
  const t = useTranslations("marketing.evento.footer");
  const year = new Date().getFullYear();

  return (
    <footer className={cn("border-t border-neutral-900/10 bg-neutral-50", className)}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/">
              <Logo variant="full" theme="default" size="sm" />
            </Link>
            <p className="mt-4 max-w-[28ch] text-sm leading-relaxed text-neutral-600">
              {t("tagline")}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.12em] text-neutral-950">
              {t("product")}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/how-it-works" className="text-sm text-neutral-600 hover:text-neutral-950">
                  {t("howItWorks")}
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-sm text-neutral-600 hover:text-neutral-950">
                  {t("features")}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-neutral-600 hover:text-neutral-950">
                  {t("pricing")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.12em] text-neutral-950">
              {t("useCases")}
            </h3>
            <ul className="mt-4 space-y-3">
              {(["weddings", "parties", "corporate", "conferences"] as const).map((key) => (
                <li key={key}>
                  <Link href="/features" className="text-sm text-neutral-600 hover:text-neutral-950">
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.12em] text-neutral-950">
              {t("resources")}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/contact" className="text-sm text-neutral-600 hover:text-neutral-950">
                  {t("help")}
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-sm text-neutral-600 hover:text-neutral-950">
                  {t("guides")}
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-sm text-neutral-600 hover:text-neutral-950">
                  {t("blog")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.12em] text-neutral-950">
              {t("company")}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/about" className="text-sm text-neutral-600 hover:text-neutral-950">
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-neutral-600 hover:text-neutral-950">
                  {t("contact")}
                </Link>
              </li>
              <li>
                <span className="text-sm text-neutral-400">{t("privacy")}</span>
              </li>
              <li>
                <span className="text-sm text-neutral-400">{t("terms")}</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-10 bg-neutral-900/10" />
        <p className="text-center text-sm text-neutral-500">
          {t("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
