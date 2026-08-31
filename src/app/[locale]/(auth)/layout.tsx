import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/shared/logo";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("common");
  const tAuth = await getTranslations("auth");

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center">
          <Logo variant="full" theme="light" size="lg" priority />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white">{t("tagline")}</h2>
          <p className="mt-4 max-w-md text-white/80">{tAuth("registerSubtitle")}</p>
        </div>
        <p className="text-sm text-white/60">© {new Date().getFullYear()} Eventos</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
