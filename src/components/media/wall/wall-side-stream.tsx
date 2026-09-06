"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { WallMediaItem } from "@/components/media/wall/types";
import { cn } from "@/lib/utils";

interface WallSideStreamProps {
  items: WallMediaItem[];
  selectedId?: string | null;
  side: "left" | "right";
  className?: string;
}

const LOOP_DURATION_SEC = 28;
/** Approximate thumb + gap; use lg size so we never under-fill on large screens. */
const UNIT_HEIGHT_PX = 112 + 12;
const MIN_REPEATS = 2;

export function WallSideStream({
  items,
  selectedId,
  side,
  className,
}: WallSideStreamProps) {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  const photos = useMemo(
    () => items.filter((item) => !item.mimeType?.startsWith("video/")),
    [items],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setContainerHeight(el.clientHeight);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [photos.length]);

  const strip = useMemo(() => {
    if (photos.length === 0) return [];

    const cycleHeight = photos.length * UNIT_HEIGHT_PX;
    // One half of the motion strip should at least fill the visible rail.
    const targetHalfHeight = Math.max(
      containerHeight,
      UNIT_HEIGHT_PX * MIN_REPEATS,
    );
    const repeats = Math.max(
      MIN_REPEATS,
      cycleHeight > 0 ? Math.ceil(targetHalfHeight / cycleHeight) : MIN_REPEATS,
    );

    const filled: WallMediaItem[] = [];
    for (let i = 0; i < repeats; i++) {
      filled.push(...photos);
    }
    // Twin copy for seamless 0% → -50% / reverse scroll.
    return [...filled, ...filled];
  }, [photos, containerHeight]);

  if (photos.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-none absolute top-16 bottom-24 hidden w-24 overflow-hidden md:block lg:w-28",
        side === "left" ? "left-3 lg:left-6" : "right-3 lg:right-6",
        className,
      )}
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
      }}
      aria-hidden
    >
      <motion.div
        className="flex flex-col gap-3 px-0.5 py-4"
        animate={
          reducedMotion
            ? undefined
            : { y: side === "left" ? ["0%", "-50%"] : ["-50%", "0%"] }
        }
        transition={
          reducedMotion
            ? undefined
            : {
                duration: LOOP_DURATION_SEC,
                ease: "linear",
                repeat: Infinity,
              }
        }
      >
        {strip.map((item, index) => {
          const isSelected = selectedId != null && item.id === selectedId;
          return (
            <div
              key={`${side}-${item.id}-${index}`}
              className={cn(
                "rounded-xl shadow-lg shadow-black/40",
                isSelected ? "ring-2 ring-white" : "ring-1 ring-white/15",
              )}
            >
              <div className="overflow-hidden rounded-xl bg-black/70">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt=""
                  className="h-24 w-full object-cover lg:h-28"
                />
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
