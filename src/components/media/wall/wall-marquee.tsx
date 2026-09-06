"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";

interface WallMarqueeProps {
  text: string;
  speedSec: number;
  hidden?: boolean;
  liveLine?: string | null;
}

export function WallMarquee({ text, speedSec, hidden, liveLine }: WallMarqueeProps) {
  const reducedMotion = useReducedMotion();

  const content = useMemo(() => {
    const parts = [text, liveLine].filter(Boolean) as string[];
    const joined = parts.join("   ·   ");
    return `${joined}   ·   ${joined}`;
  }, [text, liveLine]);

  if (hidden || !text.trim()) return null;

  const duration = Math.max(10, speedSec);

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 overflow-hidden border-t border-white/10 bg-black/35 py-2.5 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-black/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-black/80 to-transparent" />

      {reducedMotion ? (
        <p className="truncate px-4 text-center text-sm text-white/80">{text}</p>
      ) : (
        <motion.div
          className="flex whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration, ease: "linear", repeat: Infinity }}
        >
          <span className="px-8 text-sm font-medium tracking-wide text-white/85">{content}</span>
          <span className="px-8 text-sm font-medium tracking-wide text-white/85" aria-hidden>
            {content}
          </span>
        </motion.div>
      )}
    </div>
  );
}
