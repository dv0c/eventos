import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { CookieConsent } from "@/components/privacy/cookie-consent";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="org-app dark relative flex min-h-dvh flex-col overflow-x-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,oklch(0.32_0.06_55/0.45),transparent_55%),radial-gradient(ellipse_at_90%_10%,oklch(0.28_0.05_75/0.35),transparent_50%),radial-gradient(ellipse_at_50%_100%,oklch(0.22_0.04_40/0.4),transparent_55%)]"
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
