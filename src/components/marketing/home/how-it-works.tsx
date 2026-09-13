"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import {
  AlbumPhoneMockup,
  LiveWallMockup,
  QrShareMockup,
} from "./product-mockups";
import {
  Reveal,
  SectionIntro,
  SectionShell,
  marketingDisplayClass,
} from "./reveal";

const STEP_KEYS = ["step1", "step2", "step3"] as const;

function StepCopy({
  stepKey,
  title,
  desc,
  showCta,
  ctaLabel,
  t,
}: {
  stepKey: (typeof STEP_KEYS)[number];
  title: string;
  desc: string;
  showCta?: boolean;
  ctaLabel: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const chipKeys =
    stepKey === "step1"
      ? (["theme", "date", "privacy"] as const)
      : stepKey === "step3"
        ? (["cast", "live", "approve"] as const)
        : null;
  const bulletKeys =
    stepKey === "step2" ? (["link", "qr", "noApp"] as const) : null;

  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center">
      <p className="text-sm font-medium tracking-[0.08em] text-white/40">
        {t(`how.${stepKey}.label`)}
      </p>
      <h3
        className={cn(
          marketingDisplayClass,
          "mt-2 text-[clamp(1.5rem,2.2vw,2rem)] leading-tight",
        )}
      >
        {title}
      </h3>
      <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed text-white/55 sm:text-base">
        {desc}
      </p>

      {chipKeys ? (
        <ul className="mt-5 flex flex-wrap gap-2">
          {chipKeys.map((chip) => (
            <li
              key={chip}
              className="rounded-md border border-white/12 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/58"
            >
              {t(`how.${stepKey}.chips.${chip}`)}
            </li>
          ))}
        </ul>
      ) : null}

      {bulletKeys ? (
        <ul className="mt-5 space-y-2">
          {bulletKeys.map((bullet) => (
            <li
              key={bullet}
              className="flex gap-2.5 text-sm leading-relaxed text-white/52"
            >
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
              {t(`how.${stepKey}.bullets.${bullet}`)}
            </li>
          ))}
        </ul>
      ) : null}

      {stepKey !== "step1" ? (
        <dl className="mt-6 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium tracking-[0.06em] text-white/35">
              {t("how.guestsSee")}
            </dt>
            <dd className="mt-1.5 text-sm leading-snug text-white/65">
              {t(`how.${stepKey}.guests`)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-[0.06em] text-white/35">
              {t("how.hostsControl")}
            </dt>
            <dd className="mt-1.5 text-sm leading-snug text-white/65">
              {t(`how.${stepKey}.hosts`)}
            </dd>
          </div>
        </dl>
      ) : null}

      {showCta ? (
        <Link
          href="/register"
          className="mt-6 inline-flex text-[15px] font-semibold text-accent underline-offset-4 transition-colors hover:underline"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}

function StepVisual({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-md border border-white/10 bg-black/30 p-4 sm:min-h-[260px] sm:p-6">
      {children}
    </div>
  );
}

export function HomeHowItWorks() {
  const t = useTranslations("marketing.home");

  const visuals = [
    <AlbumPhoneMockup key="phone" />,
    <QrShareMockup
      key="qr"
      className="rounded-md border border-white/10 bg-black/25 shadow-none backdrop-blur-none"
    />,
    <LiveWallMockup
      key="wall"
      className="w-full max-w-md rounded-md border-white/10 shadow-none"
    />,
  ];

  const ctaLabel = t("how.step3.cta");

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-white/8 bg-black/20 py-20 sm:py-24"
    >
      <SectionShell>
        <Reveal>
          <SectionIntro
            eyebrow={t("howEyebrow")}
            title={t("howTitle")}
            description={t("howSubtitle")}
          />
        </Reveal>

        <div className="mt-12 space-y-5 sm:mt-14 sm:space-y-6">
          {STEP_KEYS.map((key, i) => {
            const flip = i % 2 === 1;
            return (
              <Reveal key={key} delay={i * 0.04}>
                <article
                  className={cn(
                    "grid items-stretch gap-6 rounded-md border border-white/10 bg-white/[0.02] p-5 sm:gap-8 sm:p-7 lg:grid-cols-2 lg:gap-10 lg:p-8",
                  )}
                >
                  <div
                    className={cn(
                      "order-2 lg:order-1",
                      flip && "lg:order-2",
                    )}
                  >
                    <StepCopy
                      stepKey={key}
                      title={t(`how.${key}.title`)}
                      desc={t(`how.${key}.desc`)}
                      showCta={i === 2}
                      ctaLabel={ctaLabel}
                      t={t}
                    />
                  </div>
                  <div
                    className={cn(
                      "order-1 lg:order-2",
                      flip && "lg:order-1",
                    )}
                  >
                    <StepVisual>{visuals[i]}</StepVisual>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </SectionShell>
    </section>
  );
}
