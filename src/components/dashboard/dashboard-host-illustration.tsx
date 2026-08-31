"use client";

import Image from "next/image";

import {
  DASHBOARD_HOST_WAVE_ALT,
  DASHBOARD_HOST_WAVE_IMAGE,
} from "@/components/dashboard/dashboard-assets";

export function DashboardHostIllustration() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed right-4 bottom-2 z-30 hidden select-none sm:right-6 lg:block"
    >
      <div className="wizard-scene-enter wizard-float">
        <Image
          src={DASHBOARD_HOST_WAVE_IMAGE}
          alt={DASHBOARD_HOST_WAVE_ALT}
          width={320}
          height={400}
          priority={false}
          className="h-auto w-[min(22vw,320px)] object-contain object-bottom"
        />
      </div>
    </div>
  );
}
