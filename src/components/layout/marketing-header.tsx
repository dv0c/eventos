"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

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

const NAV_ITEMS = [
  { href: "/features" as const, key: "product" as const },
  { href: "/how-it-works" as const, key: "howItWorks" as const },
  { href: "/pricing" as const, key: "pricing" as const },
  { href: "/resources" as const, key: "resources" as const },
];

const HIDE_AFTER_PX = 64;
const SCROLL_DELTA = 6;

const navLinkClass =
  "text-[14px] font-medium text-neutral-600 transition-colors hover:text-neutral-950";

export function MarketingHeader({ className }: { className?: string }) {
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const tEvento = useTranslations("marketing.evento");
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        if (y <= HIDE_AFTER_PX) setHidden(false);
        else if (delta > SCROLL_DELTA) setHidden(true);
        else if (delta < -SCROLL_DELTA) setHidden(false);
        lastY.current = y;
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) setHidden(false);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        hidden && !open && "pointer-events-none -translate-y-full",
        className,
      )}
    >
      <div className="px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 rounded-2xl border border-neutral-900/10 bg-white/90 px-3 shadow-[0_8px_30px_rgba(15,15,20,0.08)] backdrop-blur-md sm:h-16 sm:gap-6 sm:px-5">
          <div className="flex min-w-0 items-center gap-5 lg:gap-8">
            <Link href="/" className="shrink-0">
              <Logo variant="full" theme="default" size="sm" priority />
            </Link>

            <nav className="hidden items-center gap-5 md:flex lg:gap-7">
              {NAV_ITEMS.map(({ href, key }) => (
                <Link key={href} href={href} className={navLinkClass}>
                  {tNav(key)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2.5">
            <LocaleSwitcher
              variant="ghost"
              className="hidden text-neutral-600 hover:text-neutral-950 sm:inline-flex"
            />
            <div
              className="mx-0.5 hidden h-5 w-px bg-neutral-900/10 sm:block"
              aria-hidden
            />
            <Link
              href="/login"
              className="hidden px-2.5 text-[14px] font-medium text-neutral-600 transition-colors hover:text-neutral-950 sm:inline-flex"
            >
              {tAuth("login")}
            </Link>
            <Button
              variant="gold"
              size="sm"
              className="hidden h-10 rounded-lg px-4 text-[14px] font-semibold shadow-none sm:inline-flex"
              asChild
            >
              <Link href="/register">{tEvento("ctaCreate")}</Link>
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-neutral-800 hover:bg-neutral-900/5 md:hidden"
                  aria-label={tNav("menu")}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex h-full w-[min(100%,20rem)] flex-col border-neutral-200 bg-white p-0"
              >
                <SheetHeader className="border-b border-neutral-200 px-5 py-4 text-left">
                  <SheetTitle className="sr-only">{tNav("menu")}</SheetTitle>
                  <Logo variant="full" theme="default" size="sm" />
                </SheetHeader>
                <div className="flex flex-1 flex-col gap-1 px-3 py-4">
                  {NAV_ITEMS.map(({ href, key }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-base font-medium text-neutral-800 hover:bg-neutral-900/5"
                    >
                      {tNav(key)}
                    </Link>
                  ))}
                </div>
                <div className="flex flex-col gap-2 border-t border-neutral-200 px-5 py-4">
                  <LocaleSwitcher variant="outline" />
                  <Button variant="outline" className="h-11 rounded-lg" asChild>
                    <Link href="/login" onClick={() => setOpen(false)}>
                      {tAuth("login")}
                    </Link>
                  </Button>
                  <Button
                    variant="gold"
                    className="h-11 rounded-lg font-semibold"
                    asChild
                  >
                    <Link href="/register" onClick={() => setOpen(false)}>
                      {tEvento("ctaCreate")}
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
