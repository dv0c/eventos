import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { CookieConsent } from "@/components/privacy/cookie-consent";
import { cn } from "@/lib/utils";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "relative flex min-h-dvh flex-col bg-[#F7F4EF] text-neutral-950 antialiased",
      )}
    >
      <MarketingHeader />
      {/* Content sits above a sticky footer so the last band reveals it underneath */}
      <main className="relative z-10 flex-1 bg-[#F7F4EF]">{children}</main>
      <div className="sticky bottom-0 z-0">
        <MarketingFooter />
      </div>
      <CookieConsent />
    </div>
  );
}
