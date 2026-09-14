"use client";

import { useTranslations } from "next-intl";

import { Logo } from "@/components/shared/logo";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function MarketingFooter({ className }: { className?: string }) {
  const t = useTranslations("marketing.evento.footer");
  const year = new Date().getFullYear();

  return (
    <footer className={cn("border-t border-neutral-900/10 bg-white", className)}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/">
              <Logo variant="full" theme="default" size="sm" />
            </Link>
            <p className="mt-3 max-w-[26ch] text-sm leading-relaxed text-neutral-600">
              {t("tagline")}
            </p>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold text-neutral-950">{t("product")}</h3>
            <ul className="mt-3 space-y-2.5">
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
            <h3 className="text-[13px] font-semibold text-neutral-950">{t("company")}</h3>
            <ul className="mt-3 space-y-2.5">
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
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold text-neutral-950">{t("legal")}</h3>
            <ul className="mt-3 space-y-2.5">
              <li>
                <Link href="/resources" className="text-sm text-neutral-600 hover:text-neutral-950">
                  {t("resources")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-neutral-900/8 pt-6 text-sm text-neutral-500">
          {t("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
