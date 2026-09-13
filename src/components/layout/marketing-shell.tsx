import { EB_Garamond } from "next/font/google";

import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { CookieConsent } from "@/components/privacy/cookie-consent";
import { cn } from "@/lib/utils";

const marketingDisplay = EB_Garamond({
  subsets: ["latin", "greek"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-marketing-display",
  display: "swap",
});

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        marketingDisplay.variable,
        "org-app dark relative flex min-h-dvh flex-col bg-background text-foreground",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_0%,oklch(0.30_0.05_55/0.4),transparent_52%),radial-gradient(ellipse_at_88%_8%,oklch(0.26_0.04_75/0.28),transparent_48%),radial-gradient(ellipse_at_50%_100%,oklch(0.20_0.03_40/0.35),transparent_55%)]"
      />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <MarketingHeader />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
        <CookieConsent />
      </div>
    </div>
  );
}
