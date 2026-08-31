export interface WallDisplaySettings {
  imageDurationSec: number;
  videoDurationSec: number;
  textDurationSec: number;
  playVideoFullLength: boolean;
  hideSideImages: boolean;
  hideQrCode: boolean;
  hideCaption: boolean;
  hideLikes: boolean;
  backgroundUrl?: string | null;
}

export interface EventSections {
  mediaUploadToken?: string;
  wall?: Partial<WallDisplaySettings>;
  [key: string]: unknown;
}

export const DEFAULT_WALL_DISPLAY_SETTINGS: WallDisplaySettings = {
  imageDurationSec: 8,
  videoDurationSec: 12,
  textDurationSec: 10,
  playVideoFullLength: false,
  hideSideImages: false,
  hideQrCode: false,
  hideCaption: false,
  hideLikes: false,
  backgroundUrl: null,
};

export function mergeWallSettings(
  partial?: Partial<WallDisplaySettings> | null,
): WallDisplaySettings {
  return {
    ...DEFAULT_WALL_DISPLAY_SETTINGS,
    ...partial,
  };
}

export function getWallSettingsFromSections(sections: unknown): WallDisplaySettings {
  const parsed = (sections ?? {}) as EventSections;
  return mergeWallSettings(parsed.wall);
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
