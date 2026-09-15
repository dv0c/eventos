import { describe, expect, it } from "vitest";

import {
  collectPremiumSettingsTouches,
  FREE_PHOTO_CAP,
  isEventPremium,
} from "@/lib/event-premium";
import {
  assertPremiumSettingsAllowed,
  FREE_EVENT_QUOTA,
  PremiumRequiredError,
} from "@/server/events/event-entitlement";

describe("event premium entitlement", () => {
  it("detects premium tier", () => {
    expect(isEventPremium({ tier: "FREE" })).toBe(false);
    expect(isEventPremium({ tier: "PREMIUM" })).toBe(true);
  });

  it("exposes a free photo hard cap of 50", () => {
    expect(FREE_PHOTO_CAP).toBe(50);
  });

  it("collects premium-only settings touches (manual approval is free)", () => {
    expect(
      collectPremiumSettingsTouches({
        moderation: {
          requireManualApproval: true,
          allowVideos: true,
          allowText: true,
        },
        appearance: { removeBranding: true },
      }),
    ).toEqual(
      expect.arrayContaining(["allowVideos", "allowText", "removeBranding"]),
    );
    expect(
      collectPremiumSettingsTouches({
        moderation: { requireManualApproval: true },
      }),
    ).toEqual([]);
  });

  it("blocks premium settings on free events", () => {
    expect(() =>
      assertPremiumSettingsAllowed({ tier: "FREE" }, ["removeBranding"]),
    ).toThrow(PremiumRequiredError);
    expect(() =>
      assertPremiumSettingsAllowed({ tier: "FREE" }, ["allowVideos"]),
    ).toThrow(PremiumRequiredError);
  });

  it("allows premium settings on premium events", () => {
    expect(() =>
      assertPremiumSettingsAllowed({ tier: "PREMIUM" }, ["removeBranding"]),
    ).not.toThrow();
  });

  it("does not treat manual approval as a premium gate", () => {
    expect(() =>
      assertPremiumSettingsAllowed({ tier: "FREE" }, []),
    ).not.toThrow();
  });

  it("exposes a free quota of 3", () => {
    expect(FREE_EVENT_QUOTA).toBe(3);
  });
});
