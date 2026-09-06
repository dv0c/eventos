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

export function MarketingHeader({ className }: { className?: string }) {
  const t = useTranslations();
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const [open, setOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="mr-auto flex shrink-0 items-center md:mr-0">
          <Logo variant="full" size="md" priority />
        </Link>

        <nav className="mx-auto hidden items-center gap-7 md:flex">
          {NAV_LINKS.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              className="text-[15px] font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              {tNav(key)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <LocaleSwitcher variant="ghost" className="hidden sm:inline-flex" />
          <Link
            href="/login"
            className="hidden px-2.5 text-[15px] font-medium text-foreground/80 transition-colors hover:text-foreground sm:inline-flex"
          >
            {tAuth("signIn")}
          </Link>
          <Button
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
                className="h-10 w-10 md:hidden"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex h-full w-[min(100%,20rem)] flex-col p-0"
            >
              <SheetHeader className="border-b border-border/60 px-5 py-4 text-left">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Logo variant="full" size="sm" />
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-1 px-3 py-4">
                {NAV_LINKS.map(({ href, key }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
                  >
                    {tNav(key)}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-2 border-t border-border/60 px-5 py-4">
                <LocaleSwitcher variant="outline" />
                <Button variant="outline" className="h-11 rounded-full" asChild>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    {tAuth("signIn")}
                  </Link>
                </Button>
                <Button className="h-11 rounded-full font-semibold" asChild>
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
