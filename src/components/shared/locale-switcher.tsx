"use client";

import { Languages } from "lucide-react";
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

interface LocaleSwitcherProps {
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default" | "icon";
  className?: string;
}

export function LocaleSwitcher({
  variant = "ghost",
  size = "sm",
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
          className={cn("gap-2", className)}
          disabled={isPending}
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{localeLabels[locale]}</span>
          <span className="sm:hidden">{locale.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            className={cn(
              "cursor-pointer",
              locale === loc && "bg-accent/10 font-medium",
            )}
            onClick={() => handleLocaleChange(loc)}
          >
            {localeLabels[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
