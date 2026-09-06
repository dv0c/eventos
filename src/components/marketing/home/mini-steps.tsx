"use client";

import { Images, MousePointerClick, QrCode } from "lucide-react";
import { Fragment } from "react";
import { useTranslations } from "next-intl";

import { Reveal, SectionShell } from "./reveal";

const STEPS = [
  { key: "step1" as const, icon: MousePointerClick },
  { key: "step2" as const, icon: QrCode },
  { key: "step3" as const, icon: Images },
];

function StepConnector() {
  return (
    <svg
      className="mx-1 hidden h-7 w-12 shrink-0 text-foreground/35 lg:mx-2 lg:w-14 md:block"
      viewBox="0 0 56 28"
      fill="none"
      aria-hidden
    >
      <path
        d="M2 14 C16 14 16 6 28 6 C40 6 40 22 54 22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M48 17 L54 22 L48 24"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HomeMiniSteps() {
  const t = useTranslations("marketing.home.miniSteps");

  return (
    <SectionShell className="max-w-7xl pb-16 pt-2 sm:pb-20 sm:pt-4">
      <Reveal>
        <div className="rounded-2xl border border-foreground/15 bg-card px-5 py-5 shadow-sm sm:px-7 sm:py-6">
          <ul className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            {STEPS.map(({ key, icon: Icon }, i) => (
              <Fragment key={key}>
                {i > 0 ? (
                  <li className="hidden list-none md:block" aria-hidden>
                    <StepConnector />
                  </li>
                ) : null}
                <li className="flex min-w-0 items-center gap-3 md:flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                  <p className="text-sm font-semibold leading-snug sm:text-[15px]">
                    <span className="text-muted-foreground">
                      {t(`labels.${key}`)}
                    </span>{" "}
                    {t(key)}
                  </p>
                </li>
              </Fragment>
            ))}
          </ul>
        </div>
      </Reveal>
    </SectionShell>
  );
}
