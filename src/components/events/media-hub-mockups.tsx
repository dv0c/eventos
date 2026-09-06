"use client";

import { Heart, ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const mosaicTiles = [
  "from-primary/70 to-primary/30",
  "from-accent/60 to-accent/25",
  "from-primary/50 to-accent/35",
  "from-chart-3/50 to-primary/25",
  "from-accent/45 to-primary/20",
  "from-primary/35 to-chart-5/35",
  "from-primary/60 to-accent/20",
  "from-accent/55 to-primary/30",
];

export function AlbumPhoneMockup({ className }: { className?: string }) {
  const t = useTranslations("events.mediaHub");

  return (
    <div
      className={cn(
        "pointer-events-none relative mx-auto w-[148px] shrink-0 select-none sm:w-[168px]",
        className,
      )}
      aria-hidden
    >
      <div className="rounded-[1.6rem] border-[5px] border-foreground/85 bg-card p-1.5 shadow-lg">
        <div className="overflow-hidden rounded-[1.15rem] bg-background">
          <div className="relative aspect-[3/4] bg-gradient-to-br from-primary/35 via-accent/20 to-primary/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_55%)]" />
            <div className="absolute inset-x-0 top-0 flex justify-center pt-2">
              <div className="h-1.5 w-12 rounded-full bg-foreground/20" />
            </div>
            <div className="absolute inset-x-3 bottom-3 space-y-2">
              <div className="flex items-center justify-between rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                <span>48</span>
                <Heart className="h-3 w-3 fill-white" />
              </div>
              <div className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-[11px] font-semibold text-primary-foreground shadow-sm">
                <ImageIcon className="h-3 w-3" />
                {t("addToAlbum")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WallScreenMockup({
  qrImageUrl,
  className,
}: {
  qrImageUrl?: string | null;
  className?: string;
}) {
  const t = useTranslations("events.mediaHub");

  return (
    <div
      className={cn(
        "pointer-events-none relative w-full min-w-0 flex-1 select-none",
        className,
      )}
      aria-hidden
    >
      <div className="overflow-hidden rounded-xl border-[5px] border-foreground/80 bg-foreground shadow-lg sm:rounded-2xl sm:border-[6px]">
        <div className="relative aspect-[16/10] bg-gradient-to-br from-primary/90 via-primary/70 to-accent/50">
          <div className="absolute inset-0 grid grid-cols-4 gap-1 p-1.5 opacity-80 sm:gap-1.5 sm:p-2">
            {mosaicTiles.map((tile, i) => (
              <div
                key={`${tile}-${i}`}
                className={cn(
                  "rounded-md bg-gradient-to-br",
                  tile,
                  i === 0 && "col-span-2 row-span-2",
                )}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <div className="flex max-w-[70%] flex-col items-center gap-2 rounded-xl border border-white/30 bg-white/90 px-3 py-3 text-center shadow-lg backdrop-blur-md sm:px-4 sm:py-3.5">
              {qrImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrImageUrl}
                  alt=""
                  className="h-16 w-16 rounded-md bg-white object-contain sm:h-20 sm:w-20"
                />
              ) : (
                <div className="grid h-16 w-16 grid-cols-5 gap-0.5 rounded-md border border-primary/20 bg-white p-1.5 sm:h-20 sm:w-20">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-[0.5px]",
                        [0, 1, 2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 19, 20, 22, 23, 24].includes(
                          i,
                        )
                          ? "bg-foreground"
                          : "bg-transparent",
                      )}
                    />
                  ))}
                </div>
              )}
              <p className="text-[10px] font-semibold leading-tight text-foreground sm:text-xs">
                {t("scanToAdd")}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-1 h-1.5 w-[42%] rounded-b-md bg-foreground/70" />
      <div className="mx-auto h-1 w-[55%] rounded-b-lg bg-foreground/40" />
    </div>
  );
}
