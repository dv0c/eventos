"use client";

import Image from "next/image";
import {
  Download,
  Heart,
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
        "relative mx-auto w-[240px] rounded-[2rem] border-[6px] border-white/80 bg-black/50 p-2 shadow-2xl backdrop-blur-md sm:w-[280px]",
        className,
      )}
    >
      <div className="overflow-hidden rounded-[1.4rem] bg-background">
        <div className="relative aspect-[4/3]">
          <DemoPhoto src={DEMO.hero} sizes="280px" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <span>48 photos</span>
            <Heart className="h-3.5 w-3.5 fill-white" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1 p-1.5">
          {DEMO.tiles.map((src) => (
            <div key={src} className="relative aspect-square overflow-hidden rounded-md">
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
        "glass-panel mx-auto flex w-full max-w-sm flex-col gap-4 overflow-hidden p-0",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full">
        <DemoPhoto src={DEMO.upload} sizes="400px" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-accent backdrop-blur-sm">
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
        <div className="mx-auto grid h-28 w-28 place-items-center rounded-xl border-2 border-dashed border-accent/30 bg-accent/5">
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
        <p className="truncate rounded-lg bg-white/10 px-3 py-2 text-center font-mono text-xs text-muted-foreground">
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
        "overflow-hidden rounded-2xl border border-white/15 bg-black/60 shadow-xl backdrop-blur-md",
        className,
      )}
    >
      <div className="relative aspect-[16/10]">
        <DemoPhoto src={DEMO.wall} sizes="640px" />
        <div className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          Live wall
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div className="rounded-xl bg-black/45 px-3 py-2 text-sm text-white backdrop-blur-sm">
            <p className="font-medium">Tonight’s highlights</p>
            <p className="text-xs text-white/80">Updates as guests upload</p>
          </div>
          <div className="flex -space-x-2">
            {DEMO.tiles.slice(0, 3).map((src) => (
              <div
                key={src}
                className="relative h-10 w-10 overflow-hidden rounded-lg border-2 border-white/40"
              >
                <DemoPhoto src={src} sizes="40px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AlbumDesktopMockup({ className }: { className?: string }) {
  const grid = [...DEMO.tiles, DEMO.tiles[0], DEMO.tiles[1]];

  return (
    <div className={cn("glass-panel overflow-hidden shadow-xl", className)}>
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-chart-4/80" />
        </div>
        <div className="ml-2 flex flex-1 items-center gap-2 rounded-md bg-white/10 px-3 py-1 text-xs text-muted-foreground">
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
              "relative aspect-square overflow-hidden rounded-lg",
              i === 0 && "col-span-2 row-span-2",
            )}
          >
            <DemoPhoto src={src} sizes={i === 0 ? "320px" : "120px"} />
            {i === 2 ? (
              <div className="absolute inset-x-0 bottom-0 flex items-end p-2">
                <span className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
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

/** Tablet (live wall + QR) with overlapping phone (upload) for the hero */
export function HeroDevicesMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[520px] select-none lg:max-w-none",
        className,
      )}
    >
      <div className="relative ml-[12%] aspect-[4/3] overflow-hidden rounded-2xl border-[5px] border-white/70 bg-black/80 shadow-2xl sm:ml-[14%] sm:rounded-[1.35rem] sm:border-[6px]">
        <div className="absolute inset-0 flex">
          <div className="relative min-w-0 flex-1">
            <DemoPhoto src={DEMO.wall} sizes="520px" priority />
            <div className="absolute left-3 top-3 rounded-md bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm sm:left-4 sm:top-4 sm:text-xs">
              Live slideshow
            </div>
            <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/50 px-2.5 py-1.5 text-white backdrop-blur-sm sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-[70%]">
              <p className="text-[11px] font-medium sm:text-sm">#WhatANight</p>
              <p className="text-[9px] text-white/75 sm:text-[11px]">
                Updates as guests upload
              </p>
            </div>
          </div>
          <div className="hidden w-[28%] flex-col gap-1 border-l border-white/10 bg-black/80 p-1.5 sm:flex">
            {DEMO.tiles.slice(0, 5).map((src) => (
              <div key={src} className="relative min-h-0 flex-1 overflow-hidden rounded-sm">
                <DemoPhoto src={src} sizes="80px" />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-3 right-3 overflow-hidden rounded-lg border-2 border-accent bg-card p-0.5 shadow-lg sm:bottom-4 sm:right-4">
          <div className="relative h-12 w-12 sm:h-14 sm:w-14">
            <DemoPhoto src={DEMO.upload} sizes="56px" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-[-6%] left-0 w-[42%] max-w-[180px] sm:bottom-[-4%] sm:w-[38%] sm:max-w-[200px]">
        <div className="rounded-[1.35rem] border-[5px] border-white/80 bg-black/60 p-1.5 shadow-2xl backdrop-blur-md sm:rounded-[1.5rem] sm:border-[6px] sm:p-2">
          <div className="overflow-hidden rounded-[1rem] bg-background sm:rounded-[1.1rem]">
            <div className="relative aspect-[4/5] w-full">
              <DemoPhoto src={DEMO.upload} sizes="200px" />
              <div className="absolute inset-x-0 bottom-0 space-y-1.5 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-2.5 pt-8 sm:p-3">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/90 text-accent-foreground">
                    <ImageIcon className="h-3 w-3" />
                  </span>
                  <span className="text-[9px] font-semibold text-white sm:text-[11px]">
                    Upload photos
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {DEMO.tiles.slice(0, 3).map((src) => (
                    <div
                      key={src}
                      className="relative aspect-square overflow-hidden rounded-md"
                    >
                      <DemoPhoto src={src} sizes="60px" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
