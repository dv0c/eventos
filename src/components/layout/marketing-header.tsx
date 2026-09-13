"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Logo } from "@/components/shared/logo";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const DESKTOP_NAV = [
  { href: "/features" as const, key: "features" as const },
  { href: "/pricing" as const, key: "pricing" as const },
];

const MOBILE_NAV = [
  ...DESKTOP_NAV,
  { href: "/for-planners" as const, key: "forPlanners" as const },
  { href: "/for-businesses" as const, key: "forBusinesses" as const },
];

export function MarketingHeader({ className }: { className?: string }) {
  const t = useTranslations();
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const [open, setOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-white/8 bg-[#120A06]/75 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <Logo variant="full" theme="light" size="md" priority />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {DESKTOP_NAV.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              className="text-[15px] font-medium text-white/65 transition-colors hover:text-white"
            >
              {tNav(key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <LocaleSwitcher variant="ghost" className="hidden text-white/65 sm:inline-flex" />
          <Link
            href="/login"
            className="hidden px-2 text-[15px] font-medium text-white/65 transition-colors hover:text-white sm:inline-flex"
          >
            {tAuth("signIn")}
          </Link>
          <Button
            variant="gold"
            size="sm"
            className="hidden h-10 rounded-md px-5 text-[15px] font-semibold shadow-none sm:inline-flex"
            asChild
          >
            <Link href="/register">{t("common.getStarted")}</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white hover:bg-white/10 hover:text-white md:hidden"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex h-full w-[min(100%,20rem)] flex-col border-white/10 bg-[#120A06]/95 p-0 backdrop-blur-md"
            >
              <SheetHeader className="border-b border-white/10 px-5 py-4 text-left">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Logo variant="full" theme="light" size="sm" />
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-1 px-3 py-4">
                {MOBILE_NAV.map(({ href, key }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    {tNav(key)}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-2 border-t border-white/10 px-5 py-4">
                <LocaleSwitcher variant="outline" />
                <Button variant="outline" className="h-11 rounded-md" asChild>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    {tAuth("signIn")}
                  </Link>
                </Button>
                <Button variant="gold" className="h-11 rounded-md font-semibold" asChild>
                  <Link href="/register" onClick={() => setOpen(false)}>
                    {t("common.getStarted")}
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
