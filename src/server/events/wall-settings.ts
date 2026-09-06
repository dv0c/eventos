export type WallQrSize = "sm" | "md" | "lg" | "xl";

export interface WallDisplaySettings {
  imageDurationSec: number;
  videoDurationSec: number;
  textDurationSec: number;
  playVideoFullLength: boolean;
  hideSideImages: boolean;
  hideQrCode: boolean;
  hideCaption: boolean;
  hideNickname: boolean;
  hideLikes: boolean;
  hideMarquee: boolean;
  qrSize: WallQrSize;
  marqueeSpeed: number;
  marqueeText: string;
  transitionMs: number;
  backgroundUrl?: string | null;
  backgroundOpacity?: number;
}

export type AppearanceDisplayLanguage = "automatic" | "en" | "el";
export type AppearanceCaptionTheme = "dark" | "light";

export interface AppearanceSettings {
  displayLanguage: AppearanceDisplayLanguage;
  welcomeScreenEnabled: boolean;
  welcomeScreenTitle?: string | null;
  welcomeScreenMessage?: string | null;
  removeBranding: boolean;
  captionTheme: AppearanceCaptionTheme;
  textPostsBackgroundsEnabled: boolean;
}

export type AlbumPermission = "view_upload" | "view_only" | "upload_only";

export interface ModerationSettings {
  requireManualApproval: boolean;
  contentFilterEnabled: boolean;
  contentFilterConfig: {
    adult: boolean;
    violence: boolean;
    suggestive: boolean;
  };
  allowPhotos: boolean;
  allowVideos: boolean;
  allowText: boolean;
  albumPermission: AlbumPermission;
  disableGuestDownload: boolean;
  disableLikes: boolean;
  /** How long wall notifications stay on screen (seconds). */
  announcementDurationSec: number;
}

export interface EventSections {
  mediaUploadToken?: string;
  wall?: Partial<WallDisplaySettings>;
  appearance?: Partial<AppearanceSettings>;
  moderation?: Partial<ModerationSettings>;
  wallAnnouncement?: WallAnnouncementPayload | null;
  [key: string]: unknown;
}

export interface WallAnnouncementPayload {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  expiresAt: string;
  /** On-screen display duration for this announcement. */
  durationSec: number;
}

/** Delivery window for SSE to pick up the announcement (separate from display duration). */
export const WALL_ANNOUNCEMENT_TTL_MS = 60_000;

export const DEFAULT_ANNOUNCEMENT_DURATION_SEC = 12;
export const MIN_ANNOUNCEMENT_DURATION_SEC = 5;
export const MAX_ANNOUNCEMENT_DURATION_SEC = 60;

export function clampAnnouncementDurationSec(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_ANNOUNCEMENT_DURATION_SEC;
  return Math.min(
    MAX_ANNOUNCEMENT_DURATION_SEC,
    Math.max(MIN_ANNOUNCEMENT_DURATION_SEC, Math.round(n)),
  );
}

export function getWallAnnouncementFromSections(
  sections: unknown,
): WallAnnouncementPayload | null {
  const parsed = (sections ?? {}) as EventSections;
  const announcement = parsed.wallAnnouncement;
  if (
    !announcement ||
    typeof announcement !== "object" ||
    typeof announcement.id !== "string" ||
    typeof announcement.title !== "string" ||
    typeof announcement.body !== "string" ||
    typeof announcement.createdAt !== "string" ||
    typeof announcement.expiresAt !== "string"
  ) {
    return null;
  }
  if (Date.parse(announcement.expiresAt) <= Date.now()) {
    return null;
  }
  return {
    ...announcement,
    durationSec: clampAnnouncementDurationSec(
      announcement.durationSec ?? DEFAULT_ANNOUNCEMENT_DURATION_SEC,
    ),
  };
}

export const DEFAULT_WALL_DISPLAY_SETTINGS: WallDisplaySettings = {
  imageDurationSec: 8,
  videoDurationSec: 12,
  textDurationSec: 10,
  playVideoFullLength: false,
  hideSideImages: false,
  hideQrCode: false,
  hideCaption: false,
  hideNickname: false,
  hideLikes: false,
  hideMarquee: false,
  qrSize: "md",
  marqueeSpeed: 40,
  marqueeText: "",
  transitionMs: 600,
  backgroundUrl: null,
  backgroundOpacity: 100,
};

export const WALL_QR_SIZE_PX: Record<WallQrSize, number> = {
  sm: 96,
  md: 128,
  lg: 160,
  xl: 208,
};

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  displayLanguage: "automatic",
  welcomeScreenEnabled: false,
  welcomeScreenTitle: null,
  welcomeScreenMessage: null,
  removeBranding: false,
  captionTheme: "dark",
  textPostsBackgroundsEnabled: false,
};

export const DEFAULT_MODERATION_SETTINGS: ModerationSettings = {
  requireManualApproval: false,
  contentFilterEnabled: false,
  contentFilterConfig: {
    adult: true,
    violence: true,
    suggestive: true,
  },
  allowPhotos: true,
  allowVideos: true,
  allowText: true,
  albumPermission: "view_upload",
  disableGuestDownload: false,
  disableLikes: false,
  announcementDurationSec: DEFAULT_ANNOUNCEMENT_DURATION_SEC,
};

export function mergeWallSettings(
  partial?: Partial<WallDisplaySettings> | null,
): WallDisplaySettings {
  return {
    ...DEFAULT_WALL_DISPLAY_SETTINGS,
    ...partial,
  };
}

export function mergeAppearanceSettings(
  partial?: Partial<AppearanceSettings> | null,
): AppearanceSettings {
  return {
    ...DEFAULT_APPEARANCE_SETTINGS,
    ...partial,
  };
}

export function mergeModerationSettings(
  partial?: Partial<ModerationSettings> | null,
): ModerationSettings {
  const merged = {
    ...DEFAULT_MODERATION_SETTINGS,
    ...partial,
    contentFilterConfig: {
      ...DEFAULT_MODERATION_SETTINGS.contentFilterConfig,
      ...partial?.contentFilterConfig,
    },
  };
  return {
    ...merged,
    announcementDurationSec: clampAnnouncementDurationSec(
      partial?.announcementDurationSec ?? merged.announcementDurationSec,
    ),
  };
}

export function getWallSettingsFromSections(sections: unknown): WallDisplaySettings {
  const parsed = (sections ?? {}) as EventSections;
  return mergeWallSettings(parsed.wall);
}

export function getAppearanceFromSections(sections: unknown): AppearanceSettings {
  const parsed = (sections ?? {}) as EventSections;
  return mergeAppearanceSettings(parsed.appearance);
}

export function getModerationFromSections(sections: unknown): ModerationSettings {
  const parsed = (sections ?? {}) as EventSections;
  return mergeModerationSettings(parsed.moderation);
}

export function mergeSectionsWall(
  sections: unknown,
  wallPatch: Partial<WallDisplaySettings>,
): EventSections {
  const parsed = (sections ?? {}) as EventSections;
  return {
    ...parsed,
    wall: {
      ...mergeWallSettings(parsed.wall),
      ...wallPatch,
    },
  };
}

export function mergeSectionsAppearance(
  sections: unknown,
  appearancePatch: Partial<AppearanceSettings>,
): EventSections {
  const parsed = (sections ?? {}) as EventSections;
  return {
    ...parsed,
    appearance: {
      ...mergeAppearanceSettings(parsed.appearance),
      ...appearancePatch,
    },
  };
}

export type ModerationSettingsPatch = Omit<
  Partial<ModerationSettings>,
  "contentFilterConfig"
> & {
  contentFilterConfig?: Partial<ModerationSettings["contentFilterConfig"]>;
};

export function mergeSectionsModeration(
  sections: unknown,
  moderationPatch: ModerationSettingsPatch,
): EventSections {
  const parsed = (sections ?? {}) as EventSections;
  const current = mergeModerationSettings(parsed.moderation);
  return {
    ...parsed,
    moderation: {
      ...current,
      ...moderationPatch,
      contentFilterConfig: {
        ...current.contentFilterConfig,
        ...moderationPatch.contentFilterConfig,
      },
    },
  };
}
