import { AuthImageMontage } from "@/components/auth/auth-image-montage";
import { Logo } from "@/components/shared/logo";

/**
 * Full-viewport login-like ambient splash with only the logo (no form).
 * Fixed overlay covers AppShell chrome during org route loading.
 */
export function PlatformLogoSplash() {
  return (
    <div
      className="org-app dark fixed inset-0 z-50 flex min-h-dvh items-center justify-center overflow-hidden bg-background text-foreground"
      aria-busy="true"
      aria-label="Loading"
    >
      <AuthImageMontage />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black/45"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,oklch(0.32_0.06_55/0.28),transparent_55%),radial-gradient(ellipse_at_90%_10%,oklch(0.28_0.05_75/0.2),transparent_50%),radial-gradient(ellipse_at_50%_100%,oklch(0.14_0.03_40/0.5),transparent_55%)]"
      />
      <div className="relative z-10 animate-pulse">
        <Logo variant="full" theme="light" size="lg" priority />
      </div>
    </div>
  );
}
