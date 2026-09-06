import { getTranslations } from "next-intl/server";

import { AuthImageMontage } from "@/components/auth/auth-image-montage";
import { Logo } from "@/components/shared/logo";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("common");

  return (
    <div className="org-app dark relative min-h-dvh overflow-hidden bg-background text-foreground">
      <AuthImageMontage />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black/45"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,oklch(0.32_0.06_55/0.28),transparent_55%),radial-gradient(ellipse_at_90%_10%,oklch(0.28_0.05_75/0.2),transparent_50%),radial-gradient(ellipse_at_50%_100%,oklch(0.14_0.03_40/0.5),transparent_55%)]"
      />
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo variant="full" theme="light" size="lg" priority />
          <p className="max-w-sm text-sm text-muted-foreground">{t("tagline")}</p>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
