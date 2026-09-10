import { FileQuestion } from "lucide-react";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { MarketingShell } from "@/components/layout/marketing-shell";
import { MeindeskAuthProvider } from "@/components/providers/meindesk-auth-provider";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Link } from "@/i18n/navigation";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Root fallback when locale context is unavailable (e.g. unmatched top-level routes). */
export default async function RootNotFoundPage() {
  const locale = "en";
  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  const t = await getTranslations({ locale, namespace: "errors" });

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MeindeskAuthProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <MarketingShell>
              <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
                <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <FileQuestion className="h-8 w-8 text-primary" />
                </div>
                <p className="relative text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">
                  404
                </p>
                <h1 className="relative mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  {t("notFound")}
                </h1>
                <p className="relative mt-2 max-w-md text-muted-foreground">
                  {t("notFoundDesc")}
                </p>
                <Button variant="gold" className="relative mt-6" asChild>
                  <Link href="/">{t("backHome")}</Link>
                </Button>
              </div>
            </MarketingShell>
          </NextIntlClientProvider>
          <Toaster richColors position="top-right" />
        </MeindeskAuthProvider>
      </body>
    </html>
  );
}
