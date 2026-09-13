"use client";

import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { HeroEcosystemComposition, LightAlbumGrid } from "./hero-ecosystem";
import { Reveal, SectionIntro, SectionShell } from "./reveal";
import {
  AlbumPhoneMockup,
} from "./product-mockups";

const CATEGORIES = [
  "weddings",
  "birthdays",
  "corporate",
  "conferences",
  "parties",
  "celebrations",
] as const;

const FAQ_KEYS = [
  "noApp",
  "noAccount",
  "multiDay",
  "tv",
  "customize",
  "private",
  "moderate",
  "after",
] as const;

const USE_CASES = [
  { key: "wedding", src: "/marketing/demos/occasion-wedding.png", span: "md:col-span-7" },
  { key: "birthday", src: "/marketing/demos/occasion-birthday.png", span: "md:col-span-5" },
  { key: "corporate", src: "/marketing/demos/occasion-corporate.png", span: "md:col-span-5" },
  { key: "conference", src: "/marketing/demos/occasion-conference.png", span: "md:col-span-7" },
  { key: "party", src: "/marketing/demos/occasion-party.png", span: "md:col-span-6" },
  { key: "other", src: "/marketing/demos/occasion-other.png", span: "md:col-span-6" },
] as const;

export function EventoHomePage() {
  const t = useTranslations("marketing.evento");

  return (
    <div className="relative">
      {/* Hero */}
      <SectionShell className="pb-20 pt-12 sm:pb-28 sm:pt-16">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#A67C52]">
              {t("hero.eyebrow")}
            </p>
            <h1 className="mt-5 text-balance text-[clamp(2.2rem,4.5vw,3.75rem)] font-semibold leading-[1.08] tracking-tight text-neutral-950">
              {t("hero.title1")}
              <span className="mt-2 block text-neutral-950">{t("hero.title2")}</span>
            </h1>
            <p className="mt-6 max-w-[42ch] text-base leading-relaxed text-neutral-600 sm:text-lg">
              {t("hero.subtitle")}
            </p>
            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Button
                variant="gold"
                size="lg"
                className="h-12 rounded-lg px-7 text-base font-semibold shadow-none"
                asChild
              >
                <Link href="/register">{t("ctaCreate")}</Link>
              </Button>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-1.5 text-[15px] font-medium text-neutral-700 transition-colors hover:text-neutral-950"
              >
                {t("ctaSeeHow")}
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500">
              <li>{t("hero.trust1")}</li>
              <li className="hidden text-neutral-300 sm:inline">·</li>
              <li>{t("hero.trust2")}</li>
              <li className="hidden text-neutral-300 sm:inline">·</li>
              <li>{t("hero.trust3")}</li>
            </ul>
          </Reveal>
          <Reveal delay={0.08} className="pb-8 sm:pb-10">
            <HeroEcosystemComposition />
          </Reveal>
        </div>
      </SectionShell>

      {/* Social proof categories */}
      <section className="border-y border-neutral-900/8 bg-neutral-50 py-14 sm:py-16">
        <SectionShell>
          <Reveal>
            <p className="text-center text-lg font-medium tracking-tight text-neutral-800 sm:text-xl">
              {t("proof.title")}
            </p>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-neutral-500 sm:gap-x-10">
              {CATEGORIES.map((key) => (
                <li key={key}>{t(`proof.categories.${key}`)}</li>
              ))}
            </ul>
          </Reveal>
        </SectionShell>
      </section>

      {/* Value */}
      <SectionShell className="py-20 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                <Image
                  src="/marketing/demos/occasion-wedding.png"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="40vw"
                />
              </div>
              <div className="relative mt-8 aspect-[3/4] overflow-hidden rounded-2xl">
                <Image
                  src="/marketing/demos/album-2.png"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="40vw"
                />
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <SectionIntro title={t("value.title")} description={t("value.body")} />
            <ul className="mt-8 flex flex-wrap gap-3">
              {(["photos", "videos", "messages"] as const).map((key) => (
                <li
                  key={key}
                  className="rounded-lg border border-neutral-900/10 bg-white px-3.5 py-2 text-sm font-medium text-neutral-800"
                >
                  {t(`value.${key}`)}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </SectionShell>

      {/* How it works — compact 4-step track */}
      <section id="how-it-works" className="scroll-mt-24 border-y border-neutral-900/8 bg-white py-20 sm:py-28">
        <SectionShell>
          <Reveal>
            <SectionIntro
              eyebrow={t("how.eyebrow")}
              title={t("how.title")}
              description={t("how.subtitle")}
              align="center"
              className="mx-auto"
            />
          </Reveal>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-6">
            {(
              [
                {
                  n: "1" as const,
                  visual: (
                    <div className="flex justify-center">
                      <AlbumPhoneMockup className="w-[148px] border-neutral-300 bg-white shadow-sm sm:w-[160px] [&_*]:border-neutral-200" />
                    </div>
                  ),
                },
                {
                  n: "2" as const,
                  visual: (
                    <div className="overflow-hidden rounded-xl border border-neutral-900/10 bg-neutral-50 shadow-sm">
                      <div className="relative aspect-[4/3]">
                        <Image
                          src="/marketing/demos/upload-guest.png"
                          alt=""
                          fill
                          className="object-cover object-top"
                          sizes="280px"
                        />
                        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-8">
                          <div className="grid size-8 place-items-center rounded-md bg-white/15">
                            <div className="grid grid-cols-3 gap-px">
                              {Array.from({ length: 9 }).map((_, i) => (
                                <span
                                  key={i}
                                  className={cn(
                                    "size-1",
                                    [0, 1, 2, 3, 5, 6, 7, 8].includes(i) ? "bg-white" : "bg-transparent",
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-[11px] font-medium text-white">QR</span>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  n: "3" as const,
                  visual: (
                    <div className="overflow-hidden rounded-xl border border-neutral-900/10 shadow-sm">
                      <div className="relative aspect-[4/3]">
                        <Image
                          src="/marketing/demos/upload-guest.png"
                          alt=""
                          fill
                          className="object-cover object-[center_35%]"
                          sizes="280px"
                        />
                      </div>
                    </div>
                  ),
                },
                {
                  n: "4" as const,
                  visual: (
                    <div className="overflow-hidden rounded-xl border border-neutral-900/15 shadow-sm">
                      <div className="relative aspect-[4/3]">
                        <Image
                          src="/marketing/demos/wall-stage.png"
                          alt=""
                          fill
                          className="object-cover"
                          sizes="280px"
                        />
                      </div>
                    </div>
                  ),
                },
              ] as const
            ).map((step, i) => (
              <Reveal key={step.n} delay={i * 0.04}>
                <div className="flex h-full flex-col">
                  <p className="text-xs font-semibold tracking-[0.16em] text-[#A67C52]">
                    {t(`how.s${step.n}Label`)}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight text-neutral-950">
                    {t(`how.s${step.n}Title`)}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">
                    {t(`how.s${step.n}Desc`)}
                  </p>
                  <div className="mt-5">{step.visual}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-12 text-center">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 text-[15px] font-medium text-neutral-700 transition-colors hover:text-neutral-950"
            >
              {t("how.link")}
              <ArrowRight className="size-4" />
            </Link>
          </Reveal>
        </SectionShell>
      </section>

      {/* Album */}
      <SectionShell className="py-20 sm:py-28">
        <Reveal>
          <SectionIntro title={t("album.title")} description={t("album.subtitle")} align="center" className="mx-auto" />
        </Reveal>
        <Reveal className="mx-auto mt-12 max-w-4xl" delay={0.05}>
          <LightAlbumGrid />
        </Reveal>
      </SectionShell>

      {/* Live wall — dark cinematic */}
      <section className="bg-[#14110E] py-20 text-white sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-2xl">
              <h2 className="text-[clamp(1.75rem,3vw,2.75rem)] font-semibold tracking-tight">
                {t("wall.title")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/60 sm:text-lg">
                {t("wall.subtitle")}
              </p>
            </div>
          </Reveal>
          <Reveal className="mt-12" delay={0.05}>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <div className="relative aspect-[16/9]">
                <Image
                  src="/marketing/demos/wall-stage.png"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
            </div>
          </Reveal>
          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-white/55">
            <li>{t("wall.f1")}</li>
            <li>{t("wall.f2")}</li>
            <li>{t("wall.f3")}</li>
          </ul>
        </div>
      </section>

      {/* QR */}
      <SectionShell className="py-20 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionIntro title={t("qr.title")} description={t("qr.body")} />
          </Reveal>
          <Reveal delay={0.05}>
            <div className="relative mx-auto max-w-md">
              <div className="overflow-hidden rounded-2xl border border-neutral-900/10 shadow-sm">
                <div className="relative aspect-[4/5]">
                  <Image src="/marketing/demos/upload-guest.png" alt="" fill className="object-cover" sizes="400px" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-2 w-36 rounded-2xl border border-neutral-900/10 bg-white p-3 shadow-lg sm:-right-4 sm:w-40">
                <div className="mx-auto grid aspect-square place-items-center rounded-lg bg-neutral-100 p-2">
                  <div className="grid grid-cols-5 gap-0.5">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1.5 w-1.5",
                          [0, 1, 2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 19, 20, 22, 23, 24].includes(i)
                            ? "bg-neutral-950"
                            : "bg-transparent",
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-center text-[10px] font-semibold">{t("hero.qrLabel")}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </SectionShell>

      {/* Customize */}
      <section className="border-y border-neutral-900/8 bg-neutral-50 py-20 sm:py-28">
        <SectionShell>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <SectionIntro title={t("customize.title")} description={t("customize.subtitle")} />
            </Reveal>
            <Reveal delay={0.05}>
              <div className="rounded-2xl border border-neutral-900/10 bg-white p-6 shadow-sm sm:p-8">
                <div className="space-y-5">
                  <label className="block">
                    <span className="text-xs font-medium text-neutral-500">{t("customize.fieldTitle")}</span>
                    <div className="mt-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900">
                      Sofia &amp; Nikos · Reception
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-neutral-500">{t("customize.fieldColor")}</span>
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="size-9 rounded-full bg-[#C4A574] ring-2 ring-offset-2 ring-[#C4A574]/40" />
                      <span className="text-sm text-neutral-700">#C4A574</span>
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-neutral-500">{t("customize.fieldWelcome")}</span>
                    <div className="mt-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900">
                      Welcome — scan to join the album
                    </div>
                  </label>
                </div>
              </div>
            </Reveal>
          </div>
        </SectionShell>
      </section>

      {/* Messages — editorial frame */}
      <SectionShell className="py-20 sm:py-28">
        <Reveal>
          <SectionIntro
            title={t("messages.title")}
            description={t("messages.subtitle")}
            align="center"
            className="mx-auto"
          />
        </Reveal>
        <Reveal className="relative mx-auto mt-12 max-w-3xl" delay={0.05}>
          <div className="relative overflow-hidden rounded-2xl border border-neutral-900/10">
            <div className="relative aspect-[4/5] sm:aspect-[16/11]">
              <Image
                src="/marketing/demos/album-3.png"
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
            </div>
            <div className="absolute inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-8 sm:left-8 sm:right-auto sm:w-[min(100%,22rem)]">
              <div className="rounded-2xl border border-neutral-900/10 bg-white p-5 shadow-[0_16px_40px_rgba(15,15,20,0.18)] sm:p-6">
                <p className="text-xl font-medium tracking-tight text-neutral-950 sm:text-2xl">
                  “{t("messages.sample")}”
                </p>
                <p className="mt-3 text-sm text-neutral-500">{t("messages.meta")}</p>
              </div>
            </div>
            <div className="absolute right-4 top-4 hidden rounded-full border border-white/30 bg-white/90 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur-sm sm:right-6 sm:top-6 sm:block">
              {t("messages.caption")}
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-neutral-500 sm:hidden">{t("messages.caption")}</p>
        </Reveal>
      </SectionShell>

      {/* Use cases */}
      <section className="border-y border-neutral-900/8 bg-white py-20 sm:py-28">
        <SectionShell>
          <Reveal>
            <SectionIntro title={t("useCases.title")} />
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-12">
            {USE_CASES.map((item, i) => (
              <Reveal key={item.key} delay={i * 0.03} className={cn("col-span-12", item.span)}>
                <Link
                  href="/register"
                  className="group relative flex min-h-[220px] overflow-hidden rounded-2xl border border-neutral-900/10"
                >
                  <Image src={item.src} alt="" fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="50vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="relative mt-auto p-5 text-white sm:p-6">
                    <h3 className="text-xl font-semibold">{t(`useCases.${item.key}.title`)}</h3>
                    <p className="mt-1.5 max-w-[36ch] text-sm text-white/75">
                      {t(`useCases.${item.key}.desc`)}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-white/90">
                      <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </SectionShell>
      </section>

      {/* Differentiation */}
      <SectionShell className="py-20 sm:py-28">
        <Reveal>
          <SectionIntro title={t("diff.title")} align="center" className="mx-auto" />
        </Reveal>
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-neutral-900/10 bg-neutral-100/80 p-7 sm:p-8">
              <h3 className="text-lg font-semibold text-neutral-500">{t("diff.oldTitle")}</h3>
              <ul className="mt-6 space-y-3 text-neutral-600">
                {(["old1", "old2", "old3", "old4"] as const).map((key) => (
                  <li key={key} className="flex gap-2 text-sm sm:text-base">
                    <span className="text-neutral-400">×</span>
                    {t(`diff.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="h-full rounded-2xl border border-[#C4A574]/35 bg-[#C4A574]/10 p-7 sm:p-8">
              <h3 className="text-lg font-semibold text-neutral-950">{t("diff.newTitle")}</h3>
              <ul className="mt-6 space-y-3 text-neutral-800">
                {(["new1", "new2", "new3"] as const).map((key) => (
                  <li key={key} className="flex gap-2 text-sm sm:text-base">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#A67C52]" />
                    {t(`diff.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </SectionShell>

      {/* Testimonials */}
      <section className="border-y border-neutral-900/8 bg-neutral-50 py-20 sm:py-28">
        <SectionShell>
          <Reveal>
            <h2 className="max-w-xl text-[clamp(1.75rem,3vw,2.75rem)] font-semibold tracking-tight text-neutral-950">
              {t("testimonials.title")}
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-10 lg:grid-cols-[1.35fr_0.85fr] lg:gap-14">
            <Reveal>
              <figure>
                <blockquote className="text-[clamp(1.35rem,2.2vw,1.85rem)] font-medium leading-snug text-neutral-900">
                  “{t("testimonials.featured")}”
                </blockquote>
                <figcaption className="mt-8">
                  <p className="font-medium text-neutral-950">{t("testimonials.featuredName")}</p>
                  <p className="mt-1 text-sm text-neutral-500">{t("testimonials.featuredMeta")}</p>
                </figcaption>
              </figure>
            </Reveal>
            <div className="flex flex-col gap-8 border-t border-neutral-900/10 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <Reveal delay={0.05}>
                <figure>
                  <blockquote className="text-base leading-relaxed text-neutral-700">
                    “{t("testimonials.t2")}”
                  </blockquote>
                  <figcaption className="mt-4">
                    <p className="text-sm font-medium text-neutral-950">{t("testimonials.t2Name")}</p>
                    <p className="text-sm text-neutral-500">{t("testimonials.t2Meta")}</p>
                  </figcaption>
                </figure>
              </Reveal>
              <Reveal delay={0.08}>
                <figure>
                  <blockquote className="text-base leading-relaxed text-neutral-700">
                    “{t("testimonials.t3")}”
                  </blockquote>
                  <figcaption className="mt-4">
                    <p className="text-sm font-medium text-neutral-950">{t("testimonials.t3Name")}</p>
                    <p className="text-sm text-neutral-500">{t("testimonials.t3Meta")}</p>
                  </figcaption>
                </figure>
              </Reveal>
            </div>
          </div>
        </SectionShell>
      </section>

      {/* FAQ */}
      <SectionShell className="py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <SectionIntro title={t("faq.title")} description={t("faq.subtitle")} />
            <Button
              variant="gold"
              className="mt-8 h-11 rounded-lg px-6 font-semibold shadow-none"
              asChild
            >
              <Link href="/register">{t("ctaCreate")}</Link>
            </Button>
          </Reveal>
          <Reveal delay={0.05}>
            <Accordion type="single" collapsible className="border-t border-neutral-900/10">
              {FAQ_KEYS.map((key) => (
                <AccordionItem key={key} value={key} className="border-neutral-900/10">
                  <AccordionTrigger className="py-5 text-left text-base hover:no-underline">
                    {t(`faq.items.${key}.q`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-base leading-relaxed text-neutral-600">
                    {t(`faq.items.${key}.a`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </SectionShell>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-[#14110E] py-20 text-white sm:py-28">
        <div className="absolute inset-0 opacity-30">
          <Image src="/marketing/demos/album-hero.png" alt="" fill className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#14110E] via-[#14110E]/90 to-[#14110E]/55" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="max-w-[18ch] text-[clamp(1.85rem,3.5vw,3.25rem)] font-semibold leading-[1.1] tracking-tight">
              {t("finalCta.title")}
            </h2>
            <p className="mt-5 max-w-[40ch] text-base leading-relaxed text-white/65 sm:text-lg">
              {t("finalCta.subtitle")}
            </p>
            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Button
                variant="gold"
                size="lg"
                className="h-12 rounded-lg px-8 text-base font-semibold shadow-none"
                asChild
              >
                <Link href="/register">{t("ctaCreate")}</Link>
              </Button>
              <p className="text-sm text-white/45">{t("finalCta.trust")}</p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
