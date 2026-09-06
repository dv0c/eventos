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

const NAV_LINKS = [
  { href: "/features" as const, key: "features" as const },
  { href: "/pricing" as const, key: "pricing" as const },
  { href: "/for-planners" as const, key: "forPlanners" as const },
  { href: "/for-businesses" as const, key: "forBusinesses" as const },
];

const HEADER_HEIGHT = "4.25rem";

export function MarketingHeader({ className }: { className?: string }) {
  const t = useTranslations();
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const [open, setOpen] = useState(false);
  const [headerActive, setHeaderActive] = useState(false);

  return (
    <>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden bg-black/45 motion-safe:transition-opacity motion-safe:duration-200 md:block",
          headerActive ? "opacity-100" : "opacity-0",
        )}
        style={{ top: HEADER_HEIGHT }}
      />

      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b backdrop-blur-xl motion-safe:transition-[background-color,border-color] motion-safe:duration-200",
          headerActive
            ? "border-white/15 bg-black/80"
            : "border-white/10 bg-black/35",
          className,
        )}
      >
        <div className="mx-auto grid h-[4.25rem] max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="justify-self-start">
            <Logo variant="full" theme="light" size="md" priority />
          </Link>

          <nav
            className="group/nav hidden h-full items-center gap-7 md:flex"
            onMouseEnter={() => setHeaderActive(true)}
            onMouseLeave={() => setHeaderActive(false)}
          >
            {NAV_LINKS.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex h-full items-center text-[15px] font-medium text-white/70",
                  "motion-safe:transition-colors",
                  "after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:origin-center after:scale-x-0 after:bg-white",
                  "motion-safe:after:transition-transform motion-safe:after:duration-200",
                  "group-hover/nav:text-white/45 hover:text-white hover:after:scale-x-100",
                )}
              >
                {tNav(key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-self-end gap-1.5 sm:gap-2">
            <LocaleSwitcher variant="ghost" className="hidden text-white/70 sm:inline-flex" />
            <Link
              href="/login"
              className="hidden px-2.5 text-[15px] font-medium text-white/70 transition-colors hover:text-white sm:inline-flex sm:items-center"
            >
              {tAuth("signIn")}
            </Link>
            <Button
              variant="gold"
              size="sm"
              className="hidden h-10 rounded-full px-5 text-[15px] font-semibold shadow-none sm:inline-flex"
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
                className="flex h-full w-[min(100%,20rem)] flex-col border-white/10 bg-black/85 p-0 backdrop-blur-xl"
              >
                <SheetHeader className="border-b border-white/10 px-5 py-4 text-left">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <Logo variant="full" theme="light" size="sm" />
                </SheetHeader>
                <div className="flex flex-1 flex-col gap-1 px-3 py-4">
                  {NAV_LINKS.map(({ href, key }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      {tNav(key)}
                    </Link>
                  ))}
                </div>
                <div className="flex flex-col gap-2 border-t border-white/10 px-5 py-4">
                  <LocaleSwitcher variant="outline" />
                  <Button variant="outline" className="h-11 rounded-full" asChild>
                    <Link href="/login" onClick={() => setOpen(false)}>
                      {tAuth("signIn")}
                    </Link>
                  </Button>
                  <Button variant="gold" className="h-11 rounded-full font-semibold" asChild>
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
    </>
  );
}
