"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export function SectionShell({
  id,
  children,
  className,
  pad = "md",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  pad?: "none" | "sm" | "md" | "lg";
}) {
  const padClass =
    pad === "none"
      ? ""
      : pad === "sm"
        ? "py-12 sm:py-14"
        : pad === "lg"
          ? "py-16 sm:py-24"
          : "py-14 sm:py-20";

  return (
    <section id={id} className={cn("w-full", padClass, className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

export const marketingDisplayTitle =
  "font-[family-name:var(--font-display)] font-semibold tracking-tight text-neutral-950";

export function SectionIntro({
  eyebrow,
  title,
  description,
  className,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        align === "center" && "mx-auto max-w-2xl text-center",
        align === "left" && "max-w-xl",
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-3 text-[13px] font-medium text-[#A67C52]">{eyebrow}</p>
      ) : null}
      <h2
        className={cn(
          marketingDisplayTitle,
          "text-balance text-[clamp(1.85rem,3.2vw,2.85rem)] leading-[1.12]",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-pretty text-[15px] leading-relaxed text-neutral-600 sm:text-base",
            align === "center" ? "mx-auto max-w-[42ch]" : "max-w-[40ch]",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

/** @deprecated keep export for older imports */
export const marketingDisplayClass = marketingDisplayTitle;
