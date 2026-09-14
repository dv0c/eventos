"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { cn } from "@/lib/utils";

export const DEMO = {
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
  occasions: {
    wedding: "/marketing/demos/occasion-wedding.png",
    birthday: "/marketing/demos/occasion-birthday.png",
    corporate: "/marketing/demos/occasion-corporate.png",
    conference: "/marketing/demos/occasion-conference.png",
    party: "/marketing/demos/occasion-party.png",
    other: "/marketing/demos/occasion-other.png",
  },
} as const;

export function MarketingQrImage({
  value,
  className,
  size = 200,
}: {
  value: string;
  className?: string;
  size?: number;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark: "#14110E", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    }).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!src) {
    return (
      <div
        className={cn("animate-pulse bg-neutral-200", className)}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={cn("bg-white", className)}
    />
  );
}

export function HeroProductComposition({
  liveBadge,
  liveChip,
  qrLabel,
  className,
}: {
  liveBadge: string;
  liveChip: string;
  qrLabel: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://eventos.app";
  const qrValue = `${appUrl.replace(/\/$/, "")}/register`;

  return (
    <div className={cn("relative mx-auto w-full max-w-lg lg:max-w-none", className)}>
      <div className="relative aspect-[5/4] overflow-hidden rounded-md bg-neutral-900 sm:aspect-[4/3]">
        <Image
          src={DEMO.wall}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 560px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15" />
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm sm:left-4 sm:top-4">
          <span className="relative flex size-2">
            {!reduce ? (
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
            ) : null}
            <span className="relative size-2 rounded-full bg-emerald-400" />
          </span>
          {liveBadge}
        </div>
        <motion.div
          className="absolute bottom-3 left-3 max-w-[72%] rounded-md border border-white/12 bg-black/55 px-3 py-2 text-xs text-white backdrop-blur-sm sm:bottom-4 sm:left-4 sm:text-sm"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {liveChip}
        </motion.div>
      </div>

      <div className="absolute -bottom-6 left-2 w-[34%] max-w-[150px] sm:-bottom-8 sm:left-0 sm:w-[30%] sm:max-w-[168px]">
        <div className="overflow-hidden rounded-[1.25rem] border-[5px] border-white bg-neutral-950 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.5)] sm:rounded-[1.4rem] sm:border-[6px]">
          <div className="relative aspect-[9/16]">
            <Image src={DEMO.upload} alt="" fill className="object-cover" sizes="168px" />
          </div>
        </div>
      </div>

      <div className="absolute -right-1 top-[10%] w-[38%] max-w-[168px] sm:-right-2 sm:w-[34%] sm:max-w-[180px]">
        <div className="rounded-md border border-neutral-900/10 bg-white p-3 shadow-[0_16px_40px_-22px_rgba(40,30,20,0.4)] sm:p-3.5">
          <MarketingQrImage value={qrValue} size={140} className="mx-auto h-auto w-full" />
          <p className="mt-2 text-center text-[11px] font-medium text-neutral-600">{qrLabel}</p>
        </div>
      </div>
    </div>
  );
}

export function GuestPhoneComposition({
  eventName,
  uploadLabel,
  className,
}: {
  eventName: string;
  uploadLabel: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-[260px] sm:w-[300px]", className)}>
      <div className="rounded-[1.75rem] border-[6px] border-neutral-900 bg-neutral-900 p-1.5 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.55)]">
        <div className="overflow-hidden rounded-[1.35rem] bg-[#F7F4EF]">
          <div className="flex items-center justify-between border-b border-neutral-900/8 px-4 py-3">
            <div>
              <p className="text-[11px] text-neutral-500">Event</p>
              <p className="text-sm font-semibold text-neutral-950">{eventName}</p>
            </div>
            <span className="rounded-full bg-[#A67C52]/15 px-2 py-0.5 text-[10px] font-semibold text-[#A67C52]">
              Live
            </span>
          </div>
          <div className="relative aspect-[4/3]">
            <Image src={DEMO.hero} alt="" fill className="object-cover" sizes="300px" />
          </div>
          <div className="grid grid-cols-3 gap-1 p-1.5">
            {DEMO.tiles.slice(0, 5).map((src) => (
              <div key={src} className="relative aspect-square overflow-hidden">
                <Image src={src} alt="" fill className="object-cover" sizes="100px" />
              </div>
            ))}
          </div>
          <div className="p-3">
            <div className="flex h-11 items-center justify-center rounded-md bg-[#A67C52] text-sm font-semibold text-white">
              {uploadLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrganizerDesktopMock({
  title,
  stats,
  className,
}: {
  title: string;
  stats: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-neutral-900/10 bg-white shadow-[0_20px_50px_-28px_rgba(40,30,20,0.35)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-neutral-900/8 bg-neutral-50 px-3 py-2">
        <span className="size-2.5 rounded-full bg-neutral-300" />
        <span className="size-2.5 rounded-full bg-neutral-300" />
        <span className="size-2.5 rounded-full bg-neutral-300" />
        <span className="ml-2 truncate text-[11px] text-neutral-500">{title}</span>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-[140px_1fr] sm:p-5">
        <div className="hidden space-y-2 sm:block">
          {["Overview", "Media", "Guests", "Wall", "Settings"].map((item, i) => (
            <div
              key={item}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-[12px]",
                i === 0
                  ? "bg-neutral-900/5 font-medium text-neutral-950"
                  : "text-neutral-500",
              )}
            >
              {item}
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-md bg-[#F7F4EF] px-2.5 py-2">
                <p className="text-[10px] text-neutral-500">{stat.label}</p>
                <p className="text-sm font-semibold text-neutral-950">{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[DEMO.hero, ...DEMO.tiles.slice(0, 3)].map((src) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded-sm">
                <Image src={src} alt="" fill className="object-cover" sizes="120px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditorialGallery({
  labels,
  className,
}: {
  labels: string[];
  className?: string;
}) {
  const cells = [
    {
      src: DEMO.hero,
      className: "col-span-2 row-span-2 min-h-[240px] md:min-h-0",
      label: labels[0],
    },
    { src: DEMO.tiles[0], className: "min-h-[120px] md:min-h-0", label: labels[1] },
    { src: DEMO.tiles[1], className: "min-h-[120px] md:min-h-0", label: labels[2] },
    { src: DEMO.tiles[2], className: "min-h-[120px] md:min-h-0", label: labels[3] },
    { src: DEMO.tiles[3], className: "min-h-[120px] md:min-h-0", label: labels[4] },
    {
      src: DEMO.tiles[4],
      className: "col-span-2 min-h-[140px] md:col-span-4 md:min-h-0",
      label: labels[5],
    },
  ];

  return (
    <div
      className={cn(
        "grid auto-rows-fr grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 md:grid-rows-[minmax(160px,1fr)_minmax(160px,1fr)_minmax(140px,0.85fr)]",
        className,
      )}
    >
      {cells.map((cell) => (
        <div
          key={cell.src + cell.label}
          className={cn("group relative overflow-hidden bg-neutral-200", cell.className)}
        >
          <Image
            src={cell.src}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 50vw, 40vw"
          />
          {cell.label ? (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-2.5 opacity-0 transition-opacity group-hover:opacity-100">
              <p className="text-[11px] font-medium text-white">{cell.label}</p>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
