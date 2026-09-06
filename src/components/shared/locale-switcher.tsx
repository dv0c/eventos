"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { routing, type Locale } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const localeLabels: Record<Locale, string> = {
  el: "Ελληνικά",
  en: "English",
};

function GreekFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 480"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path fill="#0d5eaf" d="M0 0h640v480H0z" />
      <path
        stroke="#fff"
        strokeWidth="50"
        d="M0 90h640M0 170h640M0 250h640M0 330h640M0 410h640"
      />
      <path fill="#0d5eaf" d="M0 0h250v270H0z" />
      <path stroke="#fff" strokeWidth="50" d="M125 0v270M0 135h250" />
    </svg>
  );
}

function UkFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 480"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path fill="#012169" d="M0 0h640v480H0z" />
      <path
        fill="#FFF"
        d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L318 301 81 480H0v-60l239-178L0 64V0z"
      />
      <path
        fill="#C8102E"
        d="m424 281 216 159v40L369 281zm-184 20 6 35L54 480H0zM640 0v3L391 191l2-44L590 0zM0 0l239 176h-60L0 42z"
      />
      <path fill="#FFF" d="M241 0v480h160V0zM0 160v160h640V160z" />
      <path fill="#C8102E" d="M0 193v96h640v-96zM273 0v480h96V0z" />
    </svg>
  );
}

function LocaleFlag({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const flagClass = cn(
    "h-4 w-5 shrink-0 overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgba(255,255,255,0.15)]",
    className,
  );

  if (locale === "el") {
    return <GreekFlag className={flagClass} />;
  }

  return <UkFlag className={flagClass} />;
}

interface LocaleSwitcherProps {
  variant?: "ghost" | "outline" | "default" | "glass";
  size?: "sm" | "default" | "icon";
  className?: string;
}

export function LocaleSwitcher({
  variant = "ghost",
  size = "icon",
  className,
}: LocaleSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (nextLocale: Locale) => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("shrink-0", className)}
          disabled={isPending}
          aria-label={localeLabels[locale]}
          title={localeLabels[locale]}
        >
          <LocaleFlag locale={locale} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            className={cn(
              "cursor-pointer gap-2",
              locale === loc && "bg-accent/10 font-medium",
            )}
            onClick={() => handleLocaleChange(loc)}
          >
            <LocaleFlag locale={loc} />
            {localeLabels[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
