import { EventStatus } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  canPauseEvent,
  canResumeEvent,
  canStartEvent,
  canStopEvent,
  getEventLifecycle,
  getEventRunPhase,
  getLiveDeadlineAt,
  getMediaPurgeAt,
  getRestartDeadlineAt,
  isEventEnded,
  isEventWaiting,
  isGuestLiveFeaturesAllowed,
  isGuestPhotoUploadAllowed,
  isMediaRetentionExpired,
  LIVE_WINDOW_DAYS,
  MEDIA_RETENTION_DAYS,
  zonedWallTimeToUtc,
} from "@/server/events/event-ended";

describe("zonedWallTimeToUtc", () => {
  it("maps Athens winter wall time to the correct UTC instant", () => {
    const result = zonedWallTimeToUtc(2026, 0, 15, 18, 0, 0, 0);
    expect(result.toISOString()).toBe("2026-01-15T16:00:00.000Z");
  });

  it("maps Athens summer wall time to the correct UTC instant", () => {
    const result = zonedWallTimeToUtc(2026, 6, 15, 18, 0, 0, 0);
    expect(result.toISOString()).toBe("2026-07-15T15:00:00.000Z");
  });
});

describe("event run phases", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const base = {
    status: EventStatus.DRAFT,
    liveStartedAt: null as Date | null,
    pausedAt: null as Date | null,
    stoppedAt: null as Date | null,
    lockedAt: null as Date | null,
  };

  it("is idle before start", () => {
    vi.setSystemTime(new Date("2026-09-01T12:00:00.000Z"));
    expect(getEventRunPhase(base)).toBe("idle");
    expect(getEventLifecycle(base)).toBe("waiting");
    expect(isEventWaiting(base)).toBe(true);
    expect(canStartEvent(base)).toBe(true);
    expect(isGuestPhotoUploadAllowed(base)).toBe(false);
  });

  it("is live after start within the window", () => {
    const started = new Date("2026-09-01T12:00:00.000Z");
    vi.setSystemTime(new Date("2026-09-03T12:00:00.000Z"));
    const event = {
      ...base,
      status: EventStatus.ACTIVE,
      liveStartedAt: started,
    };
    expect(getEventRunPhase(event)).toBe("live");
    expect(getEventLifecycle(event)).toBe("active");
    expect(isGuestLiveFeaturesAllowed(event)).toBe(true);
    expect(canPauseEvent(event)).toBe(true);
    expect(canStopEvent(event)).toBe(true);
  });

  it("is paused when pausedAt is set; guests blocked; clock still runs", () => {
    const started = new Date("2026-09-01T12:00:00.000Z");
    vi.setSystemTime(new Date("2026-09-03T12:00:00.000Z"));
    const event = {
      ...base,
      status: EventStatus.ACTIVE,
      liveStartedAt: started,
      pausedAt: new Date("2026-09-02T12:00:00.000Z"),
    };
    expect(getEventRunPhase(event)).toBe("paused");
    expect(getEventLifecycle(event)).toBe("active");
    expect(isGuestPhotoUploadAllowed(event)).toBe(false);
    expect(canResumeEvent(event)).toBe(true);
    const deadline = getLiveDeadlineAt(event);
    expect(deadline?.toISOString()).toBe(
      new Date(started.getTime() + LIVE_WINDOW_DAYS * 86400000).toISOString(),
    );
  });

  it("treats live window expiry as locked; cannot restart", () => {
    const started = new Date("2026-09-01T12:00:00.000Z");
    vi.setSystemTime(
      new Date(started.getTime() + LIVE_WINDOW_DAYS * 86400000 + 1000),
    );
    const event = {
      ...base,
      status: EventStatus.ACTIVE,
      liveStartedAt: started,
    };
    expect(getEventRunPhase(event)).toBe("locked");
    expect(isEventEnded(event)).toBe(true);
    expect(canStartEvent(event)).toBe(false);
  });

  it("does not allow restart after stop", () => {
    const stoppedAt = new Date("2026-09-10T12:00:00.000Z");
    vi.setSystemTime(new Date("2026-09-12T12:00:00.000Z"));
    const event = {
      ...base,
      status: EventStatus.COMPLETED,
      liveStartedAt: new Date("2026-09-01T12:00:00.000Z"),
      stoppedAt,
      lockedAt: stoppedAt,
    };
    expect(getEventRunPhase(event)).toBe("locked");
    expect(canStartEvent(event)).toBe(false);
    expect(getRestartDeadlineAt(event)).toBeNull();
  });

  it("treats stopped without lockedAt as locked", () => {
    const stoppedAt = new Date("2026-09-01T12:00:00.000Z");
    vi.setSystemTime(new Date("2026-09-02T12:00:00.000Z"));
    const event = {
      ...base,
      status: EventStatus.COMPLETED,
      stoppedAt,
    };
    expect(getEventRunPhase(event)).toBe("locked");
    expect(canStartEvent(event)).toBe(false);
  });

  it("computes media purge from stoppedAt", () => {
    const stoppedAt = new Date("2026-09-01T12:00:00.000Z");
    const event = {
      ...base,
      status: EventStatus.COMPLETED,
      stoppedAt,
      lockedAt: stoppedAt,
    };
    const purge = getMediaPurgeAt(event);
    expect(purge?.toISOString()).toBe(
      new Date(stoppedAt.getTime() + MEDIA_RETENTION_DAYS * 86400000).toISOString(),
    );
    vi.setSystemTime(new Date(purge!.getTime() + 1000));
    expect(isMediaRetentionExpired(event)).toBe(true);
  });

  it("treats ARCHIVED as locked", () => {
    expect(
      getEventRunPhase({
        ...base,
        status: EventStatus.ARCHIVED,
      }),
    ).toBe("locked");
  });
});
