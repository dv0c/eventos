"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import type { WallMediaItem } from "@/components/media/wall/types";
import { cn } from "@/lib/utils";
import { WALL_REACTION_EMOJIS } from "@/lib/wall-reactions";

interface WallStageProps {
  item: WallMediaItem | null;
  transitionMs: number;
  soundEnabled: boolean;
  playVideoFullLength: boolean;
  customBackgroundUrl?: string | null;
  hideReactions?: boolean;
  hideNickname?: boolean;
  hideCaption?: boolean;
  captionTheme?: "dark" | "light";
  emptyState: ReactNode;
  onVideoEnded?: () => void;
}

export function WallStage({
  item,
  transitionMs,
  soundEnabled,
  playVideoFullLength: _playVideoFullLength,
  customBackgroundUrl,
  hideReactions,
  hideNickname,
  hideCaption,
  captionTheme = "dark",
  emptyState,
  onVideoEnded,
}: WallStageProps) {
  const reducedMotion = useReducedMotion();
  const duration = reducedMotion ? 0 : transitionMs / 1000;
  const isVideo = item?.mimeType?.startsWith("video/");

  const visibleReactions = WALL_REACTION_EMOJIS.filter(
    (emoji) => (item?.reactionCounts?.[emoji] ?? 0) > 0,
  );

  const showNickname = !hideNickname && Boolean(item?.uploadedBy);
  const showCaption = !hideCaption && Boolean(item?.caption);
  const showMeta = showNickname || showCaption;
  const showReactionBar = !hideReactions && visibleReactions.length > 0;
  const lightMeta = captionTheme === "light";

  const blurSrc = item
    ? item.mimeType?.startsWith("video/")
      ? item.thumbnailUrl
      : item.url
    : null;

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pt-14 pb-12">
      <AnimatePresence mode="sync" initial={false}>
        {item && !customBackgroundUrl ? (
          <motion.div
            key={`bg-${item.id}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration * 0.9 }}
          >
            {blurSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={blurSrc}
                alt=""
                className="h-full w-full scale-110 object-cover blur-3xl"
                aria-hidden
              />
            ) : (
              <div className="h-full w-full bg-neutral-950" aria-hidden />
            )}
            <div className="absolute inset-0 bg-black/55" />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!item ? (
        <div className="relative z-10 px-6">{emptyState}</div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={item.id}
            className="relative z-10 flex h-full max-h-full w-full max-w-[min(96vw,1280px)] items-center justify-center px-3 sm:px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
          >
            <div className="relative flex max-h-[min(86vh,960px)] w-full max-w-full items-center justify-center">
              <div className="relative max-h-full max-w-full overflow-hidden rounded-[1.25rem] bg-black/20 shadow-[0_20px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/10 sm:rounded-[1.5rem]">
                {isVideo ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video
                    key={item.id}
                    src={item.url}
                    poster={item.thumbnailUrl ?? undefined}
                    className="max-h-[min(86vh,960px)] max-w-full object-contain"
                    autoPlay
                    muted={!soundEnabled}
                    playsInline
                    loop={false}
                    onEnded={() => onVideoEnded?.()}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.caption ?? ""}
                    className="max-h-[min(86vh,960px)] max-w-full object-contain"
                  />
                )}

                {showMeta || showReactionBar ? (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-3 pb-3 pt-10">
                    {showMeta ? (
                      <div
                        className={cn(
                          "max-w-[min(92%,36rem)] rounded-2xl px-5 py-2.5 text-center shadow-lg backdrop-blur-md",
                          lightMeta ? "bg-white/92" : "bg-black/70",
                        )}
                      >
                        {showNickname ? (
                          <p
                            className={cn(
                              "text-sm font-semibold tracking-wide",
                              lightMeta ? "text-neutral-800" : "text-white",
                            )}
                          >
                            @{item.uploadedBy}
                          </p>
                        ) : null}
                        {showCaption ? (
                          <p
                            className={cn(
                              "max-h-24 overflow-y-auto text-base leading-snug break-words sm:text-lg",
                              showNickname && "mt-1",
                              lightMeta ? "text-neutral-800" : "text-white",
                            )}
                          >
                            {item.caption}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {showReactionBar ? (
                      <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 backdrop-blur-md">
                        {visibleReactions.map((emoji) => (
                          <span
                            key={emoji}
                            className="inline-flex items-center gap-1 text-sm text-white/95"
                          >
                            <span className="text-base leading-none">{emoji}</span>
                            <span className="text-xs font-medium tabular-nums">
                              {item.reactionCounts?.[emoji] ?? 0}
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
