import { describe, expect, it } from "vitest";

import {
  collectPremiumSettingsTouches,
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

  it("collects premium-only settings touches", () => {
    expect(
      collectPremiumSettingsTouches({
        moderation: { requireManualApproval: true, allowPhotos: false },
        appearance: { removeBranding: true },
      }),
    ).toEqual(
      expect.arrayContaining([
        "requireManualApproval",
        "allowPhotos",
        "removeBranding",
      ]),
    );
  });

  it("blocks premium settings on free events", () => {
    expect(() =>
      assertPremiumSettingsAllowed({ tier: "FREE" }, ["removeBranding"]),
    ).toThrow(PremiumRequiredError);
  });

  it("allows premium settings on premium events", () => {
    expect(() =>
      assertPremiumSettingsAllowed({ tier: "PREMIUM" }, ["removeBranding"]),
    ).not.toThrow();
  });

  it("exposes a free quota of 3", () => {
    expect(FREE_EVENT_QUOTA).toBe(3);
  });
});
