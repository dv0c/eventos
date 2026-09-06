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

import { Reveal, SectionShell } from "./reveal";

const FAQ_KEYS = [
  "noApp",
  "download",
  "multiDay",
  "wall",
  "privacy",
  "moderation",
  "photographer",
] as const;

export function HomeFaq() {
  const t = useTranslations("marketing.home");

  return (
    <section className="border-t border-border/50 bg-secondary/20 py-20 sm:py-28">
      <SectionShell>
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("faqTitle")}</h2>
          <p className="mt-3 text-muted-foreground sm:text-lg">{t("faqSubtitle")}</p>
          <Button className="mt-8 rounded-xl" size="lg" asChild>
            <Link href="/register">{t("faqCta")}</Link>
          </Button>
        </Reveal>

        <Reveal className="mx-auto mt-12 max-w-3xl" delay={0.08}>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_KEYS.map((key) => (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger>{t(`faq.${key}.q`)}</AccordionTrigger>
                <AccordionContent>{t(`faq.${key}.a`)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </SectionShell>
    </section>
  );
}
