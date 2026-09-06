"use client";

import {
  Download,
  Heart,
  ImageIcon,
  QrCode,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

const albumTiles = [
  "from-primary/80 to-primary/40",
  "from-accent/70 to-accent/30",
  "from-primary/50 to-accent/40",
  "from-chart-3/60 to-primary/30",
  "from-accent/50 to-primary/20",
  "from-primary/40 to-chart-5/40",
];

export function AlbumPhoneMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto w-[240px] rounded-[2rem] border-[6px] border-foreground/90 bg-card p-2 shadow-2xl sm:w-[280px]",
        className,
      )}
    >
      <div className="overflow-hidden rounded-[1.4rem] bg-background">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <span>48 photos</span>
            <Heart className="h-3.5 w-3.5 fill-white" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1 p-1.5">
          {albumTiles.map((tile) => (
            <div
              key={tile}
              className={cn("aspect-square rounded-md bg-gradient-to-br", tile)}
            />
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
        "mx-auto flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border/70 bg-card p-6 shadow-lg",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <QrCode className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">Upload QR</p>
          <p className="text-xs text-muted-foreground">Scan to join the album</p>
        </div>
      </div>
      <div className="mx-auto grid h-40 w-40 place-items-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5">
        <div className="grid grid-cols-5 gap-1 p-3">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2.5 w-2.5 rounded-[1px]",
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
      <p className="truncate rounded-lg bg-muted px-3 py-2 text-center font-mono text-xs text-muted-foreground">
        eventos.app/e/your-event
      </p>
    </div>
  );
}

export function LiveWallMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-foreground shadow-xl",
        className,
      )}
    >
      <div className="relative aspect-[16/10] bg-gradient-to-br from-primary via-primary/80 to-accent/70">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.25),transparent_50%)]" />
        <div className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          Live wall
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div className="rounded-xl bg-black/45 px-3 py-2 text-sm text-white backdrop-blur-sm">
            <p className="font-medium">Tonight’s highlights</p>
            <p className="text-xs text-white/80">Updates as guests upload</p>
          </div>
          <div className="flex -space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-10 w-10 rounded-lg border-2 border-white/40 bg-gradient-to-br from-accent to-primary"
                style={{ opacity: 1 - i * 0.15 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AlbumDesktopMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-chart-4/80" />
        </div>
        <div className="ml-2 flex flex-1 items-center gap-2 rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5" />
          Digital album
        </div>
        <Download className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4">
        {albumTiles.concat(albumTiles.slice(0, 2)).map((tile, i) => (
          <div
            key={`${tile}-${i}`}
            className={cn(
              "aspect-square rounded-lg bg-gradient-to-br",
              tile,
              i === 0 && "col-span-2 row-span-2",
            )}
          >
            {i === 2 ? (
              <div className="flex h-full items-end p-2">
                <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white">
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
      {/* Tablet */}
      <div className="relative ml-[12%] aspect-[4/3] overflow-hidden rounded-2xl border-[5px] border-foreground/85 bg-foreground shadow-2xl sm:ml-[14%] sm:rounded-[1.35rem] sm:border-[6px]">
        <div className="absolute inset-0 flex">
          <div className="relative min-w-0 flex-1 bg-gradient-to-br from-primary/90 via-primary/70 to-accent/60">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.28),transparent_55%)]" />
            <div className="absolute left-3 top-3 rounded-md bg-black/35 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm sm:left-4 sm:top-4 sm:text-xs">
              Live slideshow
            </div>
            <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/45 px-2.5 py-1.5 text-white backdrop-blur-sm sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-[70%]">
              <p className="text-[11px] font-medium sm:text-sm">#WhatANight</p>
              <p className="text-[9px] text-white/75 sm:text-[11px]">
                Updates as guests upload
              </p>
            </div>
          </div>
          <div className="hidden w-[28%] flex-col gap-1 border-l border-white/10 bg-foreground/95 p-1.5 sm:flex">
            {albumTiles.slice(0, 5).map((tile) => (
              <div
                key={tile}
                className={cn(
                  "min-h-0 flex-1 rounded-sm bg-gradient-to-br",
                  tile,
                )}
              />
            ))}
          </div>
        </div>
        <div className="absolute bottom-3 right-3 rounded-lg border-2 border-primary bg-card p-1.5 shadow-lg sm:bottom-4 sm:right-4 sm:p-2">
          <div className="grid grid-cols-4 gap-0.5">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-[0.5px] sm:h-2 sm:w-2",
                  [0, 1, 2, 3, 4, 7, 8, 11, 12, 13, 14, 15].includes(i)
                    ? "bg-foreground"
                    : "bg-transparent",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Phone overlapping left */}
      <div className="absolute bottom-[-6%] left-0 w-[42%] max-w-[180px] sm:bottom-[-4%] sm:w-[38%] sm:max-w-[200px]">
        <div className="rounded-[1.35rem] border-[5px] border-foreground/90 bg-card p-1.5 shadow-2xl sm:rounded-[1.5rem] sm:border-[6px] sm:p-2">
          <div className="overflow-hidden rounded-[1rem] bg-background sm:rounded-[1.1rem]">
            <div className="flex flex-col items-center gap-2 px-2.5 pb-2.5 pt-3 sm:gap-2.5 sm:px-3 sm:pb-3 sm:pt-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary sm:h-11 sm:w-11">
                <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="w-full rounded-full bg-primary py-1.5 text-center text-[9px] font-semibold text-primary-foreground sm:py-2 sm:text-[11px]">
                Upload photos
              </div>
              <div className="grid w-full grid-cols-3 gap-1">
                {albumTiles.slice(0, 6).map((tile) => (
                  <div
                    key={tile}
                    className={cn(
                      "aspect-square rounded-md bg-gradient-to-br",
                      tile,
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
