"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";

const MONTAGE_IMAGES = [
  { src: "/auth/montage/toast.webp", alt: "Wedding couple toasting at golden hour" },
  { src: "/auth/montage/dancefloor.webp", alt: "Guests dancing under string lights" },
  { src: "/auth/montage/bridal-party.webp", alt: "Bridal party laughing together" },
  { src: "/auth/montage/champagne-cheer.webp", alt: "Reception guests cheering with champagne" },
  { src: "/auth/montage/birthday-friends.webp", alt: "Friends celebrating at a party" },
  { src: "/auth/montage/dinner-table.webp", alt: "Elegant reception dinner table" },
  { src: "/auth/montage/first-dance.webp", alt: "Couple sharing a first dance" },
  { src: "/auth/montage/sparklers.webp", alt: "Night outdoor party with sparklers" },
] as const;

const COL_A = [...MONTAGE_IMAGES];
const COL_B = [...MONTAGE_IMAGES].reverse();

const LOOP_DURATION_SEC = 55;

function MontageTile({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="33vw"
        className="object-cover"
        priority={false}
      />
    </div>
  );
}

function MontageColumn({
  images,
  reverse,
  animate,
}: {
  images: ReadonlyArray<{ src: string; alt: string }>;
  reverse?: boolean;
  animate: boolean;
}) {
  const strip = (
    <div className="flex w-full flex-col">
      {images.map((image) => (
        <MontageTile key={image.src} src={image.src} alt={image.alt} />
      ))}
    </div>
  );

  if (!animate) {
    return <div className="flex w-full flex-col">{strip}</div>;
  }

  return (
    <motion.div
      className="flex h-max w-full flex-col"
      animate={{ y: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
      transition={{
        duration: LOOP_DURATION_SEC,
        ease: "linear",
        repeat: Infinity,
      }}
    >
      {strip}
      <div className="flex w-full flex-col" aria-hidden>
        {images.map((image) => (
          <MontageTile key={`dup-${image.src}`} src={image.src} alt="" />
        ))}
      </div>
    </motion.div>
  );
}

export function AuthImageMontage() {
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 scale-105 blur-[6px] sm:blur-md">
        <div className="flex h-full w-full flex-row">
          <div className="h-full w-1/3 overflow-hidden">
            <MontageColumn images={COL_A} animate={animate} />
          </div>
          <div className="h-full w-1/3 overflow-hidden">
            <MontageColumn images={COL_B} reverse animate={animate} />
          </div>
          <div className="h-full w-1/3 overflow-hidden">
            <MontageColumn images={COL_A} reverse animate={animate} />
          </div>
        </div>
      </div>
    </div>
  );
}
