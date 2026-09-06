"use client";

import {
  Download,
  ImageIcon,
  Lock,
  MessageSquareText,
  MonitorPlay,
  Palette,
  QrCode,
  Smartphone,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Reveal, SectionShell } from "./reveal";

const CAPS = [
  { key: "album" as const, icon: ImageIcon },
  { key: "download" as const, icon: Download },
  { key: "noApps" as const, icon: Smartphone },
  { key: "qr" as const, icon: QrCode },
  { key: "wall" as const, icon: MonitorPlay },
  { key: "customize" as const, icon: Palette },
  { key: "captions" as const, icon: MessageSquareText },
  { key: "private" as const, icon: Lock },
];

export function HomeCapabilityGrid() {
  const t = useTranslations("marketing.home");

  return (
    <SectionShell className="py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("capsTitle")}</h2>
        <p className="mt-3 text-muted-foreground sm:text-lg">{t("capsSubtitle")}</p>
      </Reveal>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {CAPS.map(({ key, icon: Icon }, i) => (
          <Reveal key={key} delay={i * 0.04}>
            <div className="glass-panel h-full p-5 transition-all hover:-translate-y-1 hover:border-white/20">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{t(`caps.${key}.title`)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {t(`caps.${key}.desc`)}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}
