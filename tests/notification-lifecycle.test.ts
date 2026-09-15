import { describe, expect, it } from "vitest";

import { getLiveDeadlineAt, LIVE_WINDOW_DAYS } from "@/server/events/event-ended";

describe("lifecycle ending-soon window", () => {
  it("flags events within 24h of live deadline", () => {
    const started = new Date("2026-09-01T12:00:00.000Z");
    const event = {
      liveStartedAt: started,
      pausedAt: null,
      stoppedAt: null,
      lockedAt: null,
    };
    const deadline = getLiveDeadlineAt(event);
    expect(deadline).not.toBeNull();

    const almostEnd = new Date(
      deadline!.getTime() - 12 * 60 * 60 * 1000,
    );
    const msLeft = deadline!.getTime() - almostEnd.getTime();
    expect(msLeft).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    expect(msLeft).toBeGreaterThan(0);

    const midWindow = new Date(
      started.getTime() + ((LIVE_WINDOW_DAYS - 2) * 24 * 60 * 60 * 1000),
    );
    const midLeft = deadline!.getTime() - midWindow.getTime();
    expect(midLeft).toBeGreaterThan(24 * 60 * 60 * 1000);
  });
});
