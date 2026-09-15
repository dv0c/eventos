import { EventTier } from "@prisma/client";

export function isEventPremium(event: {
  tier?: EventTier | string | null;
}): boolean {
  return event.tier === EventTier.PREMIUM || event.tier === "PREMIUM";
}

/** Max guest photo uploads on a Free event (hard server cap). */
export const FREE_PHOTO_CAP = 50;

/** Settings fields that require Plus (PREMIUM) tier. Manual approval is free. */
export const PREMIUM_SETTINGS_KEYS = [
  "allowVideos",
  "allowText",
  "disableGuestDownload",
  "removeBranding",
] as const;

export type PremiumSettingsKey = (typeof PREMIUM_SETTINGS_KEYS)[number];

export function collectPremiumSettingsTouches(input: {
  requireManualApproval?: boolean;
  appearance?: { removeBranding?: boolean } | null;
  moderation?: {
    requireManualApproval?: boolean;
    allowPhotos?: boolean;
    allowVideos?: boolean;
    allowText?: boolean;
    disableGuestDownload?: boolean;
  } | null;
}): PremiumSettingsKey[] {
  const touched: PremiumSettingsKey[] = [];
  if (input.appearance?.removeBranding !== undefined) {
    touched.push("removeBranding");
  }
  const mod = input.moderation;
  if (!mod) return touched;
  if (mod.allowVideos !== undefined) touched.push("allowVideos");
  if (mod.allowText !== undefined) touched.push("allowText");
  if (mod.disableGuestDownload !== undefined) touched.push("disableGuestDownload");
  return [...new Set(touched)];
}
