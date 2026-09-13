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
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export function SectionShell({
  id,
  children,
  className,
  fullBleed = false,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  fullBleed?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "w-full",
        !fullBleed && "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Display headline utility for marketing sections */
export const marketingDisplayClass =
  "font-[family-name:var(--font-marketing-display)] font-semibold tracking-tight";
