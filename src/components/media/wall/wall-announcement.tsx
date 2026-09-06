"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

interface WallAnnouncementOverlayProps {
  title: string;
  body: string;
  imageUrls: string[];
  label: string;
}

export function WallAnnouncementOverlay({
  title,
  body,
  imageUrls,
  label,
}: WallAnnouncementOverlayProps) {
  const reducedMotion = useReducedMotion();
  const mosaic = imageUrls.filter(Boolean).slice(0, 9);

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden px-6"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reducedMotion ? undefined : { opacity: 0 }}
        transition={{ duration: 0.45 }}
        aria-live="polite"
      >
        <div className="absolute inset-0">
          {mosaic.length > 0 ? (
            <div className="grid h-full w-full grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, index) => {
                const url = mosaic[index % mosaic.length]!;
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${url}-${index}`}
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                    aria-hidden
                  />
                );
              })}
            </div>
          ) : (
            <div className="h-full w-full bg-neutral-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/70 backdrop-blur-sm" />
        </div>

        <motion.div
          className="relative z-10 max-w-2xl rounded-3xl bg-black/45 px-8 py-7 text-center shadow-2xl backdrop-blur-md sm:px-12 sm:py-10"
          initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: reducedMotion ? 0 : 0.1 }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/60">
            {label}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-white/85 sm:text-xl">
            {body}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
