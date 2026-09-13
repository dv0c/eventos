"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const DEMO = {
  hero: "/marketing/demos/album-hero.png",
  wall: "/marketing/demos/wall-stage.png",
  upload: "/marketing/demos/upload-guest.png",
  tiles: [
    "/marketing/demos/album-1.png",
    "/marketing/demos/album-2.png",
    "/marketing/demos/album-3.png",
    "/marketing/demos/album-4.png",
    "/marketing/demos/album-5.png",
  ],
} as const;

export function HeroEcosystemComposition({ className }: { className?: string }) {
  const t = useTranslations("marketing.evento.hero");
  const reduce = useReducedMotion();

  return (
    <div className={cn("relative mx-auto w-full max-w-xl lg:max-w-none", className)}>
      <div className="relative aspect-[5/4] overflow-hidden rounded-2xl border border-neutral-900/10 bg-neutral-900 shadow-[0_24px_60px_-28px_rgba(40,30,20,0.45)] sm:aspect-[4/3]">
        <Image
          src={DEMO.wall}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 560px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm sm:left-4 sm:top-4">
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
            <span className="relative size-2 rounded-full bg-emerald-400" />
          </span>
          {t("liveBadge")}
        </div>
        {!reduce ? (
          <motion.div
            className="absolute bottom-3 left-3 max-w-[70%] rounded-xl border border-white/15 bg-black/55 px-3 py-2 text-xs text-white backdrop-blur-sm sm:bottom-4 sm:left-4 sm:text-sm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.45 }}
          >
            {t("liveChip")}
          </motion.div>
        ) : (
          <div className="absolute bottom-3 left-3 max-w-[70%] rounded-xl border border-white/15 bg-black/55 px-3 py-2 text-xs text-white sm:bottom-4 sm:left-4 sm:text-sm">
            {t("liveChip")}
          </div>
        )}
      </div>

      <div className="absolute -bottom-5 left-2 w-[36%] max-w-[160px] sm:-bottom-7 sm:left-0 sm:w-[32%] sm:max-w-[180px]">
        <div className="overflow-hidden rounded-[1.35rem] border-[5px] border-white bg-neutral-950 p-1 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)] sm:rounded-[1.5rem] sm:border-[6px]">
          <div className="relative aspect-[9/16] overflow-hidden rounded-[1rem]">
            <Image src={DEMO.upload} alt="" fill className="object-cover" sizes="180px" />
          </div>
        </div>
      </div>

      <div className="absolute -right-1 top-[8%] w-[34%] max-w-[150px] sm:-right-3 sm:top-[10%] sm:w-[30%] sm:max-w-[160px]">
        <div className="rounded-2xl border border-neutral-900/10 bg-white p-3 shadow-[0_16px_40px_-20px_rgba(40,30,20,0.35)] sm:p-4">
          <div className="mx-auto grid aspect-square w-full place-items-center rounded-lg bg-neutral-100 p-2">
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 w-2 rounded-[1px] sm:h-2.5 sm:w-2.5",
                    [0, 1, 2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 19, 20, 22, 23, 24].includes(i)
                      ? "bg-neutral-950"
                      : "bg-transparent",
                  )}
                />
              ))}
            </div>
          </div>
          <p className="mt-2.5 text-center text-[11px] font-semibold tracking-wide text-neutral-950 sm:text-xs">
            {t("qrLabel")}
          </p>
        </div>
      </div>
    </div>
  );
}

export function LightAlbumGrid({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-neutral-900/10 bg-white shadow-[0_20px_50px_-30px_rgba(40,30,20,0.35)]",
        className,
      )}
    >
      <div className="grid grid-cols-3 gap-1.5 p-2 sm:gap-2 sm:p-3">
        {DEMO.tiles.map((src, i) => (
          <div
            key={src}
            className={cn(
              "relative aspect-square overflow-hidden rounded-lg",
              i === 0 && "col-span-2 row-span-2",
            )}
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-cover"
              sizes={i === 0 ? "320px" : "120px"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
