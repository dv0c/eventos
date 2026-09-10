"use client";

import { useTranslations } from "next-intl";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { Reveal, SectionShell, marketingDisplayClass } from "./reveal";

const FAQ_KEYS = [
  "noApp",
  "download",
  "multiDay",
  "wall",
  "music",
  "wishes",
  "privacy",
  "moderation",
  "photographer",
] as const;

export function HomeFaq() {
  const t = useTranslations("marketing.home");

  return (
    <section className="py-24 sm:py-32">
      <SectionShell>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <Reveal>
            <h2
              className={cn(
                marketingDisplayClass,
                "text-[clamp(2rem,3.5vw,3.25rem)] leading-[1.1]",
              )}
            >
              {t("faqTitle")}
            </h2>
            <p className="mt-4 max-w-[32ch] text-base leading-relaxed text-white/55 sm:text-lg">
              {t("faqSubtitle")}
            </p>
            <Button
              variant="gold"
              className="mt-8 h-11 rounded-md px-6 font-semibold shadow-none"
              size="lg"
              asChild
            >
              <Link href="/register">{t("faqCta")}</Link>
            </Button>
          </Reveal>

          <Reveal delay={0.06}>
            <Accordion type="single" collapsible className="w-full border-t border-white/10">
              {FAQ_KEYS.map((key) => (
                <AccordionItem key={key} value={key} className="border-white/10">
                  <AccordionTrigger className="py-5 text-left text-base hover:no-underline">
                    {t(`faq.${key}.q`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-base leading-relaxed text-white/55">
                    {t(`faq.${key}.a`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </SectionShell>
    </section>
  );
}
