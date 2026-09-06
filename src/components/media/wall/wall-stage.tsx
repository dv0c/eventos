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
}

export function WallStage({
  item,
  transitionMs,
  soundEnabled,
  playVideoFullLength,
  customBackgroundUrl,
  hideReactions,
  hideNickname,
  hideCaption,
  captionTheme = "dark",
  emptyState,
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt=""
              className="h-full w-full scale-110 object-cover blur-3xl"
              aria-hidden
            />
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
            className="relative z-10 flex h-full max-h-full max-w-[min(96vw,1200px)] items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
          >
            <div className="relative inline-flex h-full max-h-full max-w-full items-center justify-center">
              {isVideo ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={item.url}
                  className="h-full max-h-full w-auto max-w-full object-contain drop-shadow-2xl"
                  autoPlay
                  muted={!soundEnabled}
                  playsInline
                  loop={!playVideoFullLength}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt={item.caption ?? ""}
                  className="h-full max-h-full w-auto max-w-full object-contain drop-shadow-2xl"
                />
              )}

              {showMeta || showReactionBar ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex flex-col items-center gap-2 px-3">
                  {showMeta ? (
                    <div
                      className={cn(
                        "max-w-full rounded-2xl px-5 py-2.5 text-center backdrop-blur-md",
                        lightMeta ? "bg-white/85" : "bg-black/45",
                      )}
                    >
                      {showNickname ? (
                        <p
                          className={cn(
                            "text-sm font-semibold tracking-wide",
                            lightMeta ? "text-neutral-800" : "text-white/90",
                          )}
                        >
                          @{item.uploadedBy}
                        </p>
                      ) : null}
                      {showCaption ? (
                        <p
                          className={cn(
                            "text-base sm:text-lg",
                            showNickname && "mt-1",
                            lightMeta ? "text-neutral-700" : "text-white/85",
                          )}
                        >
                          {item.caption}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {showReactionBar ? (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-md">
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
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
