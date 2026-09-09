import { EventStatus } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getEventLifecycle, isEventEnded, isEventWaiting, isGuestPhotoUploadAllowed } from "@/server/events/event-ended";

describe("isEventEnded", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true when status is COMPLETED regardless of date", () => {
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
    expect(
      isEventEnded({
        status: EventStatus.COMPLETED,
        date: new Date("2030-06-15T00:00:00.000Z"),
        endTime: "18:00",
      }),
    ).toBe(true);
  });

  it("returns true when status is ARCHIVED regardless of date", () => {
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
    expect(
      isEventEnded({
        status: EventStatus.ARCHIVED,
        date: new Date("2030-06-15T00:00:00.000Z"),
        endTime: null,
      }),
    ).toBe(true);
  });

  it("returns false before endTime on the event day", () => {
    const date = new Date(2026, 8, 7); // local Sep 7, 2026
    vi.setSystemTime(new Date(2026, 8, 7, 14, 0, 0, 0));
    expect(
      isEventEnded({
        status: EventStatus.ACTIVE,
        date,
        endTime: "18:00",
      }),
    ).toBe(false);
  });

  it("returns true after endTime on the event day", () => {
    const date = new Date(2026, 8, 7);
    vi.setSystemTime(new Date(2026, 8, 7, 18, 0, 0, 1));
    expect(
      isEventEnded({
        status: EventStatus.ACTIVE,
        date,
        endTime: "18:00",
      }),
    ).toBe(true);
  });

  it("uses end of day when endTime is missing", () => {
    const date = new Date(2026, 8, 7);
    vi.setSystemTime(new Date(2026, 8, 7, 23, 59, 59, 998));
    expect(
      isEventEnded({
        status: EventStatus.ACTIVE,
        date,
        endTime: null,
      }),
    ).toBe(false);

    vi.setSystemTime(new Date(2026, 8, 8, 0, 0, 0, 0));
    expect(
      isEventEnded({
        status: EventStatus.ACTIVE,
        date,
        endTime: null,
      }),
    ).toBe(true);
  });

  it("treats invalid endTime as end of day", () => {
    const date = new Date(2026, 8, 7);
    vi.setSystemTime(new Date(2026, 8, 7, 20, 0, 0, 0));
    expect(
      isEventEnded({
        status: EventStatus.PLANNING,
        date,
        endTime: "not-a-time",
      }),
    ).toBe(false);

    vi.setSystemTime(new Date(2026, 8, 8, 0, 0, 0, 0));
    expect(
      isEventEnded({
        status: EventStatus.PLANNING,
        date,
        endTime: "not-a-time",
      }),
    ).toBe(true);
  });

  it("parses HH:mm:ss endTime using hours and minutes", () => {
    const date = new Date(2026, 8, 7);
    vi.setSystemTime(new Date(2026, 8, 7, 21, 29, 0, 0));
    expect(
      isEventEnded({
        status: EventStatus.ACTIVE,
        date,
        endTime: "21:30:45",
      }),
    ).toBe(false);

    vi.setSystemTime(new Date(2026, 8, 7, 21, 30, 0, 1));
    expect(
      isEventEnded({
        status: EventStatus.ACTIVE,
        date,
        endTime: "21:30:45",
      }),
    ).toBe(true);
  });
});

describe("getEventLifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns waiting before startTime", () => {
    const date = new Date(2026, 8, 7);
    vi.setSystemTime(new Date(2026, 8, 7, 9, 0, 0, 0));
    expect(
      getEventLifecycle({
        status: EventStatus.DRAFT,
        date,
        startTime: "18:00",
        endTime: "23:00",
      }),
    ).toBe("waiting");
  });

  it("returns waiting before start of day when startTime is missing", () => {
    const date = new Date(2026, 8, 7);
    vi.setSystemTime(new Date(2026, 8, 6, 23, 0, 0, 0));
    expect(
      getEventLifecycle({
        status: EventStatus.DRAFT,
        date,
        startTime: null,
        endTime: null,
      }),
    ).toBe("waiting");
  });

  it("returns active after start and before end", () => {
    const date = new Date(2026, 8, 7);
    vi.setSystemTime(new Date(2026, 8, 7, 19, 0, 0, 0));
    expect(
      getEventLifecycle({
        status: EventStatus.DRAFT,
        date,
        startTime: "18:00",
        endTime: "23:00",
      }),
    ).toBe("active");
  });

  it("returns ended after endTime even when status is DRAFT", () => {
    const date = new Date(2026, 8, 7);
    vi.setSystemTime(new Date(2026, 8, 7, 23, 0, 0, 1));
    expect(
      getEventLifecycle({
        status: EventStatus.DRAFT,
        date,
        startTime: "18:00",
        endTime: "23:00",
      }),
    ).toBe("ended");
  });

  it("returns ended when status is COMPLETED", () => {
    const date = new Date(2030, 5, 15);
    vi.setSystemTime(new Date(2026, 0, 1, 12, 0, 0, 0));
    expect(
      getEventLifecycle({
        status: EventStatus.COMPLETED,
        date,
        startTime: "10:00",
        endTime: "18:00",
      }),
    ).toBe("ended");
  });
});

describe("isEventWaiting / isGuestPhotoUploadAllowed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("blocks guest photo upload while waiting", () => {
    const date = new Date(2026, 8, 7);
    vi.setSystemTime(new Date(2026, 8, 7, 9, 0, 0, 0));
    const event = {
      status: EventStatus.DRAFT,
      date,
      startTime: "18:00",
      endTime: "23:00",
    };
    expect(isEventWaiting(event)).toBe(true);
    expect(isGuestPhotoUploadAllowed(event)).toBe(false);
  });

  it("allows guest photo upload while active", () => {
    const date = new Date(2026, 8, 7);
    vi.setSystemTime(new Date(2026, 8, 7, 19, 0, 0, 0));
    const event = {
      status: EventStatus.DRAFT,
      date,
      startTime: "18:00",
      endTime: "23:00",
    };
    expect(isEventWaiting(event)).toBe(false);
    expect(isGuestPhotoUploadAllowed(event)).toBe(true);
  });

  it("allows guest photo upload after the event has ended", () => {
    const date = new Date(2026, 8, 7);
    vi.setSystemTime(new Date(2026, 8, 7, 23, 30, 0, 0));
    const event = {
      status: EventStatus.DRAFT,
      date,
      startTime: "18:00",
      endTime: "23:00",
    };
    expect(isEventWaiting(event)).toBe(false);
    expect(isGuestPhotoUploadAllowed(event)).toBe(true);
  });
});
