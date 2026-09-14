"use client";

import Image from "next/image";
import { ArrowRight, Heart, MessageCircle, Video } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import {
  DEMO,
  EditorialGallery,
  GuestPhoneComposition,
  HeroProductComposition,
  MarketingQrImage,
  OrganizerDesktopMock,
} from "./home-compositions";
import {
  marketingDisplayTitle,
  Reveal,
  SectionIntro,
  SectionShell,
} from "./reveal";

const FAQ_KEYS = [
  "noApp",
  "noAccount",
  "tv",
  "moderate",
  "customize",
  "after",
] as const;

const JOURNEY = [
  { key: "create" as const, visual: "org" as const },
  { key: "share" as const, visual: "qr" as const },
  { key: "remember" as const, visual: "album" as const },
];

const USE_CASES = [
  { key: "wedding", src: DEMO.occasions.wedding, span: "md:col-span-7 md:row-span-2" },
  { key: "birthday", src: DEMO.occasions.birthday, span: "md:col-span-5" },
  { key: "corporate", src: DEMO.occasions.corporate, span: "md:col-span-5" },
  { key: "conference", src: DEMO.occasions.conference, span: "md:col-span-4" },
  { key: "party", src: DEMO.occasions.party, span: "md:col-span-4" },
  { key: "other", src: DEMO.occasions.other, span: "md:col-span-4" },
] as const;

const LIVE_ITEMS = ["i1", "i2", "i3", "i4"] as const;

export function EventoHomePage() {
  const t = useTranslations("marketing.evento");
  const reduce = useReducedMotion();
  const [liveIndex, setLiveIndex] = useState(0);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://eventos.app";
  const qrValue = `${appUrl.replace(/\/$/, "")}/register`;

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      setLiveIndex((i) => (i + 1) % LIVE_ITEMS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <div className="relative overflow-x-clip">
      {/* Hero */}
      <SectionShell pad="md" className="pt-8 sm:pt-12">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-14">
          <Reveal>
            <h1
              className={cn(
                marketingDisplayTitle,
                "text-balance text-[clamp(2.25rem,5vw,4rem)] leading-[1.05]",
              )}
            >
              {t("hero.title1")}
              <span className="mt-1.5 block">{t("hero.title2")}</span>
            </h1>
            <p className="mt-5 max-w-[38ch] text-[15px] leading-relaxed text-neutral-600 sm:text-base">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button
                variant="gold"
                size="lg"
                className="h-11 rounded-md px-6 text-[15px] font-semibold shadow-none"
                asChild
              >
                <Link href="/register">{t("ctaCreate")}</Link>
              </Button>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-700 hover:text-neutral-950"
              >
                {t("ctaSeeHow")}
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <p className="mt-8 text-[13px] text-neutral-500">
              {t("hero.trust1")}
              <span className="mx-2 text-neutral-300">·</span>
              {t("hero.trust2")}
              <span className="mx-2 text-neutral-300">·</span>
              {t("hero.trust3")}
            </p>
          </Reveal>
          <Reveal delay={0.06} className="min-w-0 pb-10 sm:pb-12">
            <HeroProductComposition
              liveBadge={t("hero.liveBadge")}
              liveChip={t("hero.liveChip")}
              qrLabel={t("hero.qrLabel")}
            />
          </Reveal>
        </div>
      </SectionShell>

      {/* Proof */}
      <div className="border-y border-neutral-900/8 bg-white">
        <SectionShell pad="md">
          <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
            <Reveal>
              <SectionIntro title={t("proof.title")} description={t("proof.body")} />
            </Reveal>
            <Reveal delay={0.05}>
              <div className="relative pb-6 sm:pb-4">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={DEMO.hero}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 55vw"
                  />
                </div>
                <div className="absolute -bottom-2 left-2 flex gap-2 sm:-bottom-3 sm:left-0">
                  {DEMO.tiles.slice(0, 3).map((src, i) => (
                    <div
                      key={src}
                      className="relative h-14 w-14 overflow-hidden border-2 border-white shadow-md sm:h-20 sm:w-20"
                      style={{ transform: `translateY(${i % 2 === 0 ? 0 : 8}px)` }}
                    >
                      <Image src={src} alt="" fill className="object-cover" sizes="80px" />
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </SectionShell>
      </div>

      {/* Journey */}
      <SectionShell id="how-it-works" pad="md">
        <Reveal>
          <SectionIntro
            eyebrow={t("how.eyebrow")}
            title={t("how.journeyTitle")}
            description={t("how.journeySubtitle")}
          />
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
          {JOURNEY.map((step, index) => (
            <Reveal key={step.key} delay={index * 0.05}>
              <div className="flex h-full flex-col overflow-hidden border border-neutral-900/10 bg-white">
                <div className="relative aspect-[5/4] bg-[#F7F4EF]">
                  {step.visual === "org" ? (
                    <div className="absolute inset-3 overflow-hidden sm:inset-4">
                      <OrganizerDesktopMock
                        title={t("how.create.visualTitle")}
                        stats={[
                          { label: t("org.statPhotos"), value: "0" },
                          { label: t("org.statGuests"), value: "—" },
                          { label: t("org.statWall"), value: t("org.statOff") },
                        ]}
                        className="h-full shadow-none"
                      />
                    </div>
                  ) : null}
                  {step.visual === "qr" ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MarketingQrImage
                        value={qrValue}
                        size={148}
                        className="rounded-sm shadow-sm"
                      />
                    </div>
                  ) : null}
                  {step.visual === "album" ? (
                    <div className="absolute inset-2 grid grid-cols-2 gap-1.5 sm:inset-3">
                      {[DEMO.hero, ...DEMO.tiles.slice(0, 3)].map((src) => (
                        <div key={src} className="relative overflow-hidden">
                          <Image src={src} alt="" fill className="object-cover" sizes="200px" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col border-t border-neutral-900/8 px-4 py-4">
                  <p className="text-[11px] font-medium tracking-[0.14em] text-[#A67C52]">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-1.5 text-base font-semibold text-neutral-950">
                    {t(`how.${step.key}.title`)}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-snug text-neutral-600">
                    {t(`how.${step.key}.desc`)}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </SectionShell>

      {/* QR */}
      <section className="relative overflow-hidden bg-[#14110E] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <Image src={DEMO.wall} alt="" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <Reveal className="mx-auto max-w-xl text-center">
            <h2
              className={cn(
                "font-[family-name:var(--font-display)] text-balance text-[clamp(1.9rem,3.5vw,3rem)] font-semibold leading-[1.1] tracking-tight text-white",
              )}
            >
              {t("qr.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-[36ch] text-[15px] leading-relaxed text-white/70">
              {t("qr.body")}
            </p>
          </Reveal>

          <Reveal
            delay={0.05}
            className="relative mx-auto mt-10 flex max-w-3xl items-end justify-center gap-4 sm:gap-8"
          >
            <div className="hidden w-[140px] shrink-0 sm:block lg:w-[168px]">
              <GuestPhoneComposition
                eventName={t("guest.eventName")}
                uploadLabel={t("guest.upload")}
                className="w-full origin-bottom scale-[0.92]"
              />
            </div>
            <div className="relative z-10 rounded-2xl bg-white p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] sm:p-6">
              <MarketingQrImage value={qrValue} size={220} className="rounded-md" />
              <p className="mt-3 text-center text-[12px] font-medium text-neutral-600">
                {t("hero.qrLabel")}
              </p>
            </div>
            <div className="hidden w-[120px] shrink-0 self-center lg:block">
              <div className="space-y-3 text-left text-sm text-white/80">
                <p>{t("qr.step1")}</p>
                <p>{t("qr.step2")}</p>
                <p>{t("qr.step3")}</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="mt-8 flex justify-center gap-2 sm:hidden">
            {[t("qr.step1"), t("qr.step2"), t("qr.step3")].map((step) => (
              <span
                key={step}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] text-white/80"
              >
                {step.replace(/^\d+\s+/, "")}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Guest */}
      <SectionShell pad="md">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal className="order-2 lg:order-1">
            <GuestPhoneComposition
              eventName={t("guest.eventName")}
              uploadLabel={t("guest.upload")}
            />
          </Reveal>
          <Reveal className="order-1 lg:order-2">
            <SectionIntro title={t("guest.title")} description={t("guest.body")} />
          </Reveal>
        </div>
      </SectionShell>

      {/* Gallery */}
      <div className="bg-white">
        <SectionShell pad="md">
          <Reveal>
            <SectionIntro title={t("album.title")} description={t("album.subtitle")} />
          </Reveal>
          <Reveal delay={0.04} className="mt-8">
            <EditorialGallery
              labels={[
                t("gallery.l1"),
                t("gallery.l2"),
                t("gallery.l3"),
                t("gallery.l4"),
                t("gallery.l5"),
                t("gallery.l6"),
              ]}
            />
          </Reveal>
        </SectionShell>
      </div>

      {/* Wall */}
      <section className="bg-[#14110E] text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:px-8">
          <Reveal>
            <h2
              className={cn(
                "font-[family-name:var(--font-display)] text-balance text-[clamp(1.85rem,3.2vw,2.85rem)] font-semibold leading-[1.12] tracking-tight text-white",
              )}
            >
              {t("wall.title")}
            </h2>
            <p className="mt-4 max-w-[38ch] text-[15px] leading-relaxed text-white/70">
              {t("wall.subtitle")}
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/75">
              <li>{t("wall.f1")}</li>
              <li>{t("wall.f2")}</li>
              <li>{t("wall.f3")}</li>
            </ul>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={DEMO.wall}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Live feed */}
      <SectionShell pad="sm">
        <Reveal>
          <SectionIntro title={t("live.title")} description={t("live.body")} />
        </Reveal>
        <Reveal delay={0.04} className="mt-6">
          <div className="divide-y divide-neutral-900/8 overflow-hidden rounded-md border border-neutral-900/10 bg-white">
            {LIVE_ITEMS.map((key, index) => {
              const active = index === liveIndex;
              return (
                <motion.div
                  key={key}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors sm:px-5",
                    active ? "bg-[#F7F4EF]" : "bg-white",
                  )}
                  animate={reduce ? undefined : { opacity: active ? 1 : 0.72 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="relative size-10 shrink-0 overflow-hidden bg-neutral-200">
                    <Image
                      src={DEMO.tiles[index % DEMO.tiles.length]}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-950">
                      {t(`live.${key}`)}
                    </p>
                    <p className="text-[12px] text-neutral-500">{t(`live.${key}Meta`)}</p>
                  </div>
                  {active && !reduce ? (
                    <span className="hidden size-1.5 shrink-0 rounded-full bg-[#A67C52] sm:block" />
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        </Reveal>
      </SectionShell>

      {/* More than photos */}
      <div className="bg-white">
        <SectionShell pad="md">
          <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
            <Reveal>
              <SectionIntro title={t("messages.title")} description={t("messages.subtitle")} />
              <div className="mt-6 flex flex-wrap gap-2">
                {(
                  [
                    { key: "cap1", icon: MessageCircle },
                    { key: "cap2", icon: Heart },
                    { key: "cap3", icon: Video },
                  ] as const
                ).map(({ key, icon: Icon }) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-neutral-900/10 bg-[#F7F4EF] px-3 py-1.5 text-[13px] font-medium text-neutral-800"
                  >
                    <Icon className="size-3.5 text-[#A67C52]" />
                    {t(`messages.${key}`)}
                  </span>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <div className="relative">
                <div className="relative aspect-[5/4] overflow-hidden">
                  <Image
                    src={DEMO.tiles[2]}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div className="absolute bottom-4 left-4 right-4 max-w-md rounded-md border border-white/20 bg-white/95 p-4 shadow-lg backdrop-blur-sm sm:left-6 sm:right-auto">
                  <p className="text-[15px] font-medium leading-snug text-neutral-950">
                    {t("messages.sample")}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-[12px] text-neutral-500">{t("messages.meta")}</p>
                    <div className="flex items-center gap-1.5 text-[#A67C52]">
                      <Heart className="size-3.5 fill-current" />
                      <span className="text-[12px] font-medium">24</span>
                    </div>
                  </div>
                </div>
                <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                  <Video className="size-3" />
                  {t("messages.cap3")}
                </div>
              </div>
            </Reveal>
          </div>
        </SectionShell>
      </div>

      {/* Organizer */}
      <SectionShell pad="md">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <Reveal>
            <SectionIntro title={t("org.title")} description={t("org.body")} />
            <Button
              variant="gold"
              className="mt-6 h-11 rounded-md px-5 font-semibold shadow-none"
              asChild
            >
              <Link href="/register">{t("ctaCreate")}</Link>
            </Button>
          </Reveal>
          <Reveal delay={0.05}>
            <OrganizerDesktopMock
              title={t("org.mockTitle")}
              stats={[
                { label: t("org.statPhotos"), value: "248" },
                { label: t("org.statGuests"), value: "86" },
                { label: t("org.statWall"), value: t("org.statOn") },
              ]}
            />
          </Reveal>
        </div>
      </SectionShell>

      {/* Use cases */}
      <div className="bg-white">
        <SectionShell pad="md">
          <Reveal>
            <SectionIntro title={t("useCases.title")} />
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-12 md:auto-rows-[minmax(170px,1fr)] md:gap-3">
            {USE_CASES.map((item) => (
              <Link
                key={item.key}
                href="/register"
                className={cn(
                  "group relative aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[160px]",
                  item.span,
                )}
              >
                <Image
                  src={item.src}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 50vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <p className="absolute bottom-3 left-3 text-sm font-semibold text-white">
                  {t(`useCases.${item.key}.title`)}
                </p>
              </Link>
            ))}
          </div>
        </SectionShell>
      </div>

      {/* Testimonials */}
      <SectionShell pad="md">
        <Reveal>
          <SectionIntro title={t("testimonials.title")} />
        </Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {(["featured", "t2", "t3"] as const).map((key) => (
            <Reveal key={key} delay={key === "featured" ? 0 : key === "t2" ? 0.04 : 0.08}>
              <blockquote className="h-full border-t border-neutral-900/15 pt-5">
                <p className="text-[15px] leading-relaxed text-neutral-800">
                  {key === "featured" ? t("testimonials.featured") : t(`testimonials.${key}`)}
                </p>
                <footer className="mt-4">
                  <p className="text-sm font-semibold text-neutral-950">
                    {key === "featured"
                      ? t("testimonials.featuredName")
                      : t(`testimonials.${key}Name`)}
                  </p>
                  <p className="text-[13px] text-neutral-500">
                    {key === "featured"
                      ? t("testimonials.featuredMeta")
                      : t(`testimonials.${key}Meta`)}
                  </p>
                </footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </SectionShell>

      {/* FAQ */}
      <div className="bg-white">
        <SectionShell pad="sm">
          <Reveal>
            <SectionIntro title={t("faq.title")} description={t("faq.subtitle")} />
          </Reveal>
          <Reveal delay={0.04} className="mx-auto mt-6 max-w-2xl">
            <Accordion type="single" collapsible className="w-full">
              {FAQ_KEYS.map((key) => (
                <AccordionItem key={key} value={key} className="border-neutral-900/10">
                  <AccordionTrigger className="text-left text-[15px] font-medium text-neutral-950 hover:no-underline">
                    {t(`faq.items.${key}.q`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-neutral-600">
                    {t(`faq.items.${key}.a`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </SectionShell>
      </div>

      {/* Final CTA */}
      <section className="relative z-10 overflow-hidden bg-[#14110E] pb-8">
        <Image
          src={DEMO.wall}
          alt=""
          fill
          className="object-cover opacity-[0.18]"
          sizes="100vw"
        />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <Reveal>
            <h2
              className={cn(
                "font-[family-name:var(--font-display)] text-balance text-[clamp(1.9rem,3.5vw,3rem)] font-semibold leading-[1.1] tracking-tight text-white",
              )}
            >
              {t("finalCta.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-[40ch] text-[15px] text-white/70">
              {t("finalCta.subtitle")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button
                variant="gold"
                size="lg"
                className="h-11 rounded-md px-6 font-semibold shadow-none"
                asChild
              >
                <Link href="/register">{t("ctaCreate")}</Link>
              </Button>
              <Link
                href="#how-it-works"
                className="text-[14px] font-medium text-white/80 hover:text-white"
              >
                {t("ctaSeeHow")}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
