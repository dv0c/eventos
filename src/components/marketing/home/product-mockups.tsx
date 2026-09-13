"use client";

import Image from "next/image";
import {
  Download,
  ImageIcon,
  QrCode,
  Sparkles,
} from "lucide-react";

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
    "/marketing/demos/album-hero.png",
  ],
} as const;

function DemoPhoto({
  src,
  alt = "",
  className,
  sizes = "200px",
  priority = false,
}: {
  src: string;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}

export function AlbumPhoneMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto w-[240px] rounded-[1.75rem] border-[5px] border-white/70 bg-black/60 p-1.5 sm:w-[280px] sm:rounded-[2rem] sm:border-[6px] sm:p-2",
        className,
      )}
    >
      <div className="overflow-hidden rounded-[1.25rem] bg-background sm:rounded-[1.4rem]">
        <div className="relative aspect-[4/3]">
          <DemoPhoto src={DEMO.hero} sizes="280px" />
        </div>
        <div className="grid grid-cols-3 gap-1 p-1.5">
          {DEMO.tiles.map((src) => (
            <div key={src} className="relative aspect-square overflow-hidden rounded-sm">
              <DemoPhoto src={src} sizes="90px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function QrShareMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-sm flex-col gap-4 overflow-hidden rounded-md border border-white/10 bg-black/30 p-0",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full">
        <DemoPhoto src={DEMO.upload} sizes="400px" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-accent">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Upload QR</p>
              <p className="text-xs text-white/70">Scan to join the album</p>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-3 px-5 pb-5">
        <div className="mx-auto grid h-28 w-28 place-items-center rounded-md border border-dashed border-white/20 bg-white/5">
          <div className="grid grid-cols-5 gap-1 p-2">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 w-2 rounded-[1px]",
                  [0, 1, 2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 19, 20, 22, 23, 24].includes(
                    i,
                  )
                    ? "bg-foreground"
                    : "bg-transparent",
                )}
              />
            ))}
          </div>
        </div>
        <p className="truncate rounded-md bg-white/8 px-3 py-2 text-center font-mono text-xs text-muted-foreground">
          eventos.app/e/your-event
        </p>
      </div>
    </div>
  );
}

export function LiveWallMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-white/10 bg-black/50",
        className,
      )}
    >
      <div className="relative aspect-[16/10]">
        <DemoPhoto src={DEMO.wall} sizes="640px" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
      </div>
    </div>
  );
}

export function AlbumDesktopMockup({ className }: { className?: string }) {
  const grid = [...DEMO.tiles, DEMO.tiles[0], DEMO.tiles[1]];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-white/10 bg-black/30",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
        </div>
        <div className="ml-2 flex flex-1 items-center gap-2 rounded-md bg-white/8 px-3 py-1 text-xs text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5" />
          Digital album
        </div>
        <Download className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4">
        {grid.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className={cn(
              "relative aspect-square overflow-hidden rounded-sm",
              i === 0 && "col-span-2 row-span-2",
            )}
          >
            <DemoPhoto src={src} sizes={i === 0 ? "320px" : "120px"} />
            {i === 2 ? (
              <div className="absolute inset-x-0 bottom-0 flex items-end p-2">
                <span className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                  <Sparkles className="mr-0.5 inline h-2.5 w-2.5" />
                  Caption
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Editorial hero: dominant wall photo + overlapping phone preview */
export function HeroEditorialComposition({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[560px] select-none lg:max-w-none",
        className,
      )}
    >
      <div className="relative aspect-[5/4] overflow-hidden rounded-md sm:aspect-[4/3]">
        <DemoPhoto src={DEMO.wall} sizes="(max-width: 1024px) 100vw, 560px" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      <div className="absolute -bottom-6 left-4 w-[38%] max-w-[170px] sm:-bottom-8 sm:left-0 sm:w-[34%] sm:max-w-[190px]">
        <div className="overflow-hidden rounded-[1.25rem] border-[5px] border-white/75 bg-black/70 p-1 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] sm:rounded-[1.4rem] sm:border-[6px] sm:p-1.5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[0.9rem] sm:rounded-[1rem]">
            <DemoPhoto src={DEMO.upload} sizes="190px" />
          </div>
        </div>
      </div>

      <div className="absolute -right-2 top-[12%] hidden w-[28%] max-w-[140px] overflow-hidden rounded-md sm:block lg:-right-4">
        <div className="relative aspect-[3/4]">
          <DemoPhoto src={DEMO.hero} sizes="140px" />
        </div>
      </div>
    </div>
  );
}

/** @deprecated Prefer HeroEditorialComposition — kept for any external refs */
export function HeroDevicesMockup({ className }: { className?: string }) {
  return <HeroEditorialComposition className={className} />;
}
