import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { MeindeskAuthProvider } from "@/components/providers/meindesk-auth-provider";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Eventos",
    template: "%s | Eventos",
  },
  description: "Premium event planning platform for weddings, celebrations, and corporate events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="el"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MeindeskAuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </MeindeskAuthProvider>
      </body>
    </html>
  );
}
