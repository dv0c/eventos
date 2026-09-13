import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { CookieConsent } from "@/components/privacy/cookie-consent";
import { cn } from "@/lib/utils";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "relative flex min-h-dvh flex-col bg-white text-neutral-950 antialiased",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(85vh,720px)] bg-[radial-gradient(ellipse_at_30%_-10%,rgba(200,180,150,0.18),transparent_55%),radial-gradient(ellipse_at_85%_10%,rgba(230,235,245,0.55),transparent_50%),linear-gradient(to_bottom,rgba(255,255,255,0)_55%,#ffffff_100%)]"
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
