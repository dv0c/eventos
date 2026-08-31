import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_WALL_DISPLAY_SETTINGS,
  getWallSettingsFromSections,
  mergeSectionsWall,
  mergeWallSettings,
} from "@/server/events/wall-settings";

describe("wall settings", () => {
  it("merges partial settings with defaults", () => {
    const merged = mergeWallSettings({ imageDurationSec: 15 });
    expect(merged.imageDurationSec).toBe(15);
    expect(merged.videoDurationSec).toBe(DEFAULT_WALL_DISPLAY_SETTINGS.videoDurationSec);
    expect(merged.hideQrCode).toBe(false);
  });

  it("reads wall settings from sections JSON", () => {
    const settings = getWallSettingsFromSections({
      mediaUploadToken: "abc",
      wall: { hideCaption: true, imageDurationSec: 5 },
    });

    expect(settings.hideCaption).toBe(true);
    expect(settings.imageDurationSec).toBe(5);
    expect(settings.hideQrCode).toBe(false);
  });

  it("merges wall patch into sections without losing other keys", () => {
    const next = mergeSectionsWall(
      { mediaUploadToken: "token-1", hero: true },
      { hideSideImages: true },
    );

    expect(next.mediaUploadToken).toBe("token-1");
    expect(next.hero).toBe(true);
    expect(next.wall?.hideSideImages).toBe(true);
  });
});

describe("getEventAdminContext", () => {
  it("returns canEdit false when no session", async () => {
    vi.doMock("@/server/auth/session", () => ({
      getSession: vi.fn().mockResolvedValue(null),
    }));

    const { getEventAdminContext } = await import("@/server/events/event-admin");
    const result = await getEventAdminContext("event-1");
    expect(result.canEdit).toBe(false);
  });
});
