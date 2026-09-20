"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type StoryCreateKind = "text" | "post" | "video";

type ModeOption = {
  id: StoryCreateKind;
  label: string;
};

type StoryModeSliderProps = {
  modes: ModeOption[];
  value: StoryCreateKind;
  disabled?: boolean;
  onChange: (next: StoryCreateKind) => void;
  className?: string;
};

/**
 * Instagram-style mode rail: active label stays centered; neighbors sit left/right.
 */
export function StoryModeSlider({
  modes,
  value,
  disabled,
  onChange,
  className,
}: StoryModeSliderProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<StoryCreateKind, HTMLButtonElement>>(new Map());
  const lockScrollRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [padX, setPadX] = useState(48);

  function measurePad() {
    const scroller = scrollerRef.current;
    const active = itemRefs.current.get(value);
    if (!scroller || !active) return;
    setPadX(Math.max(24, scroller.clientWidth / 2 - active.offsetWidth / 2));
  }

  function scrollToValue(behavior: ScrollBehavior) {
    const el = itemRefs.current.get(value);
    const scroller = scrollerRef.current;
    if (!el || !scroller) return;
    lockScrollRef.current = true;
    const left = el.offsetLeft - scroller.clientWidth / 2 + el.offsetWidth / 2;
    scroller.scrollTo({ left: Math.max(0, left), behavior });
    window.setTimeout(
      () => {
        lockScrollRef.current = false;
      },
      behavior === "smooth" ? 320 : 16,
    );
  }

  useLayoutEffect(() => {
    measurePad();
  }, [value, modes]);

  useLayoutEffect(() => {
    scrollToValue("auto");
  }, [value, modes, padX]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const ro = new ResizeObserver(() => {
      measurePad();
      scrollToValue("auto");
    });
    ro.observe(scroller);
    return () => ro.disconnect();
  }, [value, modes]);

  function nearestMode(): StoryCreateKind {
    const scroller = scrollerRef.current;
    if (!scroller) return value;
    const center = scroller.scrollLeft + scroller.clientWidth / 2;
    let best = value;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const mode of modes) {
      const node = itemRefs.current.get(mode.id);
      if (!node) continue;
      const mid = node.offsetLeft + node.offsetWidth / 2;
      const dist = Math.abs(mid - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = mode.id;
      }
    }
    return best;
  }

  function settleFromScroll() {
    if (disabled || lockScrollRef.current) return;
    const next = nearestMode();
    if (next !== value) onChange(next);
    else scrollToValue("smooth");
  }

  return (
    <div className={cn("relative w-full", className)}>
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory items-center gap-7 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingLeft: padX, paddingRight: padX }}
        onScroll={() => {
          if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
          settleTimerRef.current = setTimeout(settleFromScroll, 90);
        }}
      >
        {modes.map((mode) => {
          const active = mode.id === value;
          return (
            <button
              key={mode.id}
              type="button"
              ref={(node) => {
                if (node) itemRefs.current.set(mode.id, node);
                else itemRefs.current.delete(mode.id);
              }}
              disabled={disabled}
              onClick={() => onChange(mode.id)}
              className={cn(
                "snap-center shrink-0 whitespace-nowrap py-1 text-[12px] font-semibold uppercase tracking-[0.18em] transition-colors duration-150",
                active ? "text-white" : "text-white/40",
                disabled && "pointer-events-none opacity-50",
              )}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
