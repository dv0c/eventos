"use client";

import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import {
  AlbumPhoneMockup,
  LiveWallMockup,
  QrShareMockup,
} from "./product-mockups";
import { Reveal, SectionShell, marketingDisplayClass } from "./reveal";

const STEP_KEYS = ["step1", "step2", "step3"] as const;

function StepCopy({
  index,
  title,
  desc,
  showCta,
  ctaLabel,
}: {
  index: number;
  title: string;
  desc: string;
  showCta?: boolean;
  ctaLabel: string;
}) {
  return (
    <div>
      <p className="text-sm text-white/40">{String(index + 1).padStart(2, "0")}</p>
      <h3
        className={cn(
          marketingDisplayClass,
          "mt-3 text-3xl leading-tight sm:text-4xl",
        )}
      >
        {title}
      </h3>
      <p className="mt-4 max-w-[38ch] text-base leading-relaxed text-white/55 sm:text-lg">
        {desc}
      </p>
      {showCta ? (
        <Link
          href="/register"
          className="mt-8 inline-flex text-[15px] font-semibold text-accent underline-offset-4 transition-colors hover:underline"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}

function StickyVisualColumn({
  visuals,
  titles,
  descs,
  ctaLabel,
}: {
  visuals: ReactNode[];
  titles: string[];
  descs: string[];
  ctaLabel: string;
}) {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const nodes = stepRefs.current.filter(Boolean) as HTMLElement[];
    if (nodes.length === 0) return;

    const ratios = new Map<Element, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target, entry.intersectionRatio);
        }
        let bestIndex = 0;
        let bestRatio = -1;
        nodes.forEach((node, i) => {
          const ratio = ratios.get(node) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = i;
          }
        });
        setActive((prev) => (prev === bestIndex ? prev : bestIndex));
      },
      {
        root: null,
        // Bias toward the middle of the viewport where sticky visual sits
        rootMargin: "-30% 0px -40% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mt-20 grid grid-cols-2 items-start gap-12 xl:gap-16">
      <div className="sticky top-24 self-start">
        <div className="relative mx-auto h-[min(480px,58svh)] w-full max-w-md">
          {visuals.map((visual, i) => (
            <motion.div
              key={STEP_KEYS[i]}
              className="absolute inset-0 flex items-center justify-center"
              initial={false}
              animate={{ opacity: active === i ? 1 : 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden={active !== i}
            >
              {visual}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-36 pb-8 pt-4 xl:space-y-44">
        {STEP_KEYS.map((key, i) => (
          <article
            key={key}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            className="min-h-[40svh]"
          >
            <StepCopy
              index={i}
              title={titles[i]}
              desc={descs[i]}
              showCta={i === 2}
              ctaLabel={ctaLabel}
            />
          </article>
        ))}
      </div>
    </div>
  );
}

function StackedSteps({
  visuals,
  titles,
  descs,
  ctaLabel,
}: {
  visuals: ReactNode[];
  titles: string[];
  descs: string[];
  ctaLabel: string;
}) {
  return (
    <div className="mt-16 space-y-24 sm:mt-20 sm:space-y-28">
      {STEP_KEYS.map((key, i) => (
        <div key={key} className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
          <Reveal delay={0.04}>{visuals[i]}</Reveal>
          <Reveal delay={0.08}>
            <StepCopy
              index={i}
              title={titles[i]}
              desc={descs[i]}
              showCta={i === 2}
              ctaLabel={ctaLabel}
            />
          </Reveal>
        </div>
      ))}
    </div>
  );
}

export function HomeHowItWorks() {
  const t = useTranslations("marketing.home");
  const reduce = useReducedMotion();

  const visuals = [
    <AlbumPhoneMockup key="phone" />,
    <QrShareMockup
      key="qr"
      className="rounded-md border border-white/10 bg-black/25 shadow-none backdrop-blur-none"
    />,
    <LiveWallMockup
      key="wall"
      className="w-full rounded-md border-white/10 shadow-none"
    />,
  ];

  const titles = STEP_KEYS.map((key) => t(`how.${key}.title`));
  const descs = STEP_KEYS.map((key) => t(`how.${key}.desc`));
  const ctaLabel = t("how.step1.cta");

  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <SectionShell>
        <Reveal className="max-w-2xl">
          <h2
            className={cn(
              marketingDisplayClass,
              "text-[clamp(2rem,3.5vw,3.25rem)] leading-[1.1]",
            )}
          >
            {t("howTitle")}
          </h2>
          <p className="mt-4 max-w-[40ch] text-base leading-relaxed text-white/55 sm:text-lg">
            {t("howSubtitle")}
          </p>
        </Reveal>

        {reduce ? (
          <StackedSteps
            visuals={visuals}
            titles={titles}
            descs={descs}
            ctaLabel={ctaLabel}
          />
        ) : (
          <>
            <div className="lg:hidden">
              <StackedSteps
                visuals={visuals}
                titles={titles}
                descs={descs}
                ctaLabel={ctaLabel}
              />
            </div>
            <div className="hidden lg:block">
              <StickyVisualColumn
                visuals={visuals}
                titles={titles}
                descs={descs}
                ctaLabel={ctaLabel}
              />
            </div>
          </>
        )}
      </SectionShell>
    </section>
  );
}
