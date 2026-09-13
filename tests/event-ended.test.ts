import { EventStatus } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getEventEndAt,
  getEventLifecycle,
  getEventStartAt,
  getMediaPurgeAt,
  isEventEnded,
  isEventWaiting,
  isGuestPhotoUploadAllowed,
  isMediaRetentionExpired,
  MEDIA_RETENTION_DAYS,
  zonedWallTimeToUtc,
} from "@/server/events/event-ended";

/** UTC midnight for a calendar yyyy-MM-dd (how coerce.date stores dates). */
function utcDate(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

describe("zonedWallTimeToUtc", () => {
  it("maps Athens winter wall time to the correct UTC instant", () => {
    // 2026-01-15 18:00 Europe/Athens = 16:00 UTC (EET, UTC+2)
    const result = zonedWallTimeToUtc(2026, 0, 15, 18, 0, 0, 0);
    expect(result.toISOString()).toBe("2026-01-15T16:00:00.000Z");
  });

  it("maps Athens summer wall time to the correct UTC instant", () => {
    // 2026-07-15 18:00 Europe/Athens = 15:00 UTC (EEST, UTC+3)
    const result = zonedWallTimeToUtc(2026, 6, 15, 18, 0, 0, 0);
    expect(result.toISOString()).toBe("2026-07-15T15:00:00.000Z");
  });
});

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
        date: utcDate(2030, 5, 15),
        endTime: "18:00",
      }),
    ).toBe(true);
  });

  it("returns true when status is ARCHIVED regardless of date", () => {
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
    expect(
      isEventEnded({
        status: EventStatus.ARCHIVED,
        date: utcDate(2030, 5, 15),
        endTime: null,
      }),
    ).toBe(true);
  });

  it("returns false before Athens endTime on the event day", () => {
    // Sep 7 2026 is EEST (UTC+3). end 18:00 Athens = 15:00 UTC
    const date = utcDate(2026, 8, 7);
    vi.setSystemTime(new Date("2026-09-07T14:00:00.000Z"));
    expect(
      isEventEnded({
        status: EventStatus.ACTIVE,
        date,
        endTime: "18:00",
      }),
    ).toBe(false);
  });

  it("returns true after Athens endTime on the event day", () => {
    const date = utcDate(2026, 8, 7);
    vi.setSystemTime(new Date("2026-09-07T15:00:00.001Z"));
    expect(
      isEventEnded({
        status: EventStatus.ACTIVE,
        date,
        endTime: "18:00",
      }),
    ).toBe(true);
  });

  it("does not end early when server is UTC and wall time is Athens evening", () => {
    // Previously setHours(18) on UTC midnight ended at 18:00 UTC (= 21:00 Athens).
    // At 19:00 UTC / 22:00 Athens with endTime 23:00 Athens, event must still be active.
    const date = utcDate(2026, 8, 7);
    vi.setSystemTime(new Date("2026-09-07T19:00:00.000Z"));
    expect(
      isEventEnded({
        status: EventStatus.ACTIVE,
        date,
        endTime: "23:00",
      }),
    ).toBe(false);
  });

  it("uses end of Athens day when endTime is missing", () => {
    const date = utcDate(2026, 8, 7);
    // 23:59:59.998 Athens = 20:59:59.998 UTC in EEST
    vi.setSystemTime(new Date("2026-09-07T20:59:59.998Z"));
    expect(
      isEventEnded({
        status: EventStatus.ACTIVE,
        date,
        endTime: null,
      }),
    ).toBe(false);

    vi.setSystemTime(new Date("2026-09-07T21:00:00.000Z"));
    expect(
      isEventEnded({
        status: EventStatus.ACTIVE,
        date,
        endTime: null,
      }),
    ).toBe(true);
  });

  it("treats invalid endTime as end of Athens day", () => {
    const date = utcDate(2026, 8, 7);
    vi.setSystemTime(new Date("2026-09-07T17:00:00.000Z"));
    expect(
      isEventEnded({
        status: EventStatus.PLANNING,
        date,
        endTime: "not-a-time",
      }),
    ).toBe(false);

    vi.setSystemTime(new Date("2026-09-07T21:00:00.000Z"));
    expect(
      isEventEnded({
        status: EventStatus.PLANNING,
        date,
        endTime: "not-a-time",
      }),
    ).toBe(true);
  });

  it("parses HH:mm:ss endTime using hours and minutes in Athens", () => {
    const date = utcDate(2026, 8, 7);
    // 21:30 Athens = 18:30 UTC
    vi.setSystemTime(new Date("2026-09-07T18:29:00.000Z"));
    expect(
      isEventEnded({
        status: EventStatus.ACTIVE,
        date,
        endTime: "21:30:45",
      }),
    ).toBe(false);

    vi.setSystemTime(new Date("2026-09-07T18:30:00.001Z"));
    expect(
      isEventEnded({
        status: EventStatus.ACTIVE,
        date,
        endTime: "21:30:45",
      }),
    ).toBe(true);
  });

  it("returns false before endDate even when start date has passed", () => {
    const date = utcDate(2026, 8, 7);
    const endDate = utcDate(2026, 8, 17);
    // Sep 8 noon UTC — still before Sep 17 end
    vi.setSystemTime(new Date("2026-09-08T12:00:00.000Z"));
    expect(
      isEventEnded({
        status: EventStatus.ACTIVE,
        date,
        endDate,
        endTime: "23:59",
      }),
    ).toBe(false);
  });

  it("returns true after endDate + Athens endTime", () => {
    const date = utcDate(2026, 8, 7);
    const endDate = utcDate(2026, 8, 17);
    // 23:59 Athens on Sep 17 = 20:59 UTC
    vi.setSystemTime(new Date("2026-09-17T20:59:00.001Z"));
    expect(
      isEventEnded({
        status: EventStatus.ACTIVE,
        date,
        endDate,
        endTime: "23:59",
      }),
    ).toBe(true);
  });

  it("rolls overnight endTime to the next calendar day when endDate is unset", () => {
    const date = utcDate(2026, 8, 7);
    const end = getEventEndAt({
      date,
      startTime: "17:00",
      endTime: "02:00",
    });
    // 02:00 Athens next day (Sep 8) = 23:00 UTC Sep 7 in EEST
    expect(end.toISOString()).toBe("2026-09-07T23:00:00.000Z");

    vi.setSystemTime(new Date("2026-09-07T20:00:00.000Z")); // 23:00 Athens same evening
    expect(
      isEventEnded({
        status: EventStatus.ACTIVE,
        date,
        startTime: "17:00",
        endTime: "02:00",
      }),
    ).toBe(false);

    vi.setSystemTime(new Date("2026-09-07T23:00:00.001Z"));
    expect(
      isEventEnded({
        status: EventStatus.ACTIVE,
        date,
        startTime: "17:00",
        endTime: "02:00",
      }),
    ).toBe(true);
  });

  it("does not overnight-roll when endDate is explicitly set", () => {
    const date = utcDate(2026, 8, 7);
    const endDate = utcDate(2026, 8, 7);
    const end = getEventEndAt({
      date,
      endDate,
      startTime: "20:00",
      endTime: "02:00",
    });
    // Uses endDate day as-is: 02:00 Athens Sep 7 = 23:00 UTC Sep 6
    expect(end.toISOString()).toBe("2026-09-06T23:00:00.000Z");
  });
});

describe("getEventLifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns waiting before Athens startTime", () => {
    const date = utcDate(2026, 8, 7);
    // 09:00 Athens = 06:00 UTC
    vi.setSystemTime(new Date("2026-09-07T06:00:00.000Z"));
    expect(
      getEventLifecycle({
        status: EventStatus.DRAFT,
        date,
        startTime: "18:00",
        endTime: "23:00",
      }),
    ).toBe("waiting");
  });

  it("returns waiting before start of Athens day when startTime is missing", () => {
    const date = utcDate(2026, 8, 7);
    vi.setSystemTime(new Date("2026-09-06T20:00:00.000Z")); // still Sep 6 evening UTC / Sep 6 23:00 Athens
    expect(
      getEventLifecycle({
        status: EventStatus.DRAFT,
        date,
        startTime: null,
        endTime: null,
      }),
    ).toBe("waiting");
  });

  it("returns active after Athens start and before end", () => {
    const date = utcDate(2026, 8, 7);
    // 19:00 Athens = 16:00 UTC
    vi.setSystemTime(new Date("2026-09-07T16:00:00.000Z"));
    expect(
      getEventLifecycle({
        status: EventStatus.DRAFT,
        date,
        startTime: "18:00",
        endTime: "23:00",
      }),
    ).toBe("active");
  });

  it("returns ended after Athens endTime even when status is DRAFT", () => {
    const date = utcDate(2026, 8, 7);
    // 23:00 Athens = 20:00 UTC
    vi.setSystemTime(new Date("2026-09-07T20:00:00.001Z"));
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
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
    expect(
      getEventLifecycle({
        status: EventStatus.COMPLETED,
        date: utcDate(2030, 5, 15),
        startTime: "10:00",
        endTime: "18:00",
      }),
    ).toBe("ended");
  });
});

describe("guest photo upload gate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("blocks guest photo upload while waiting", () => {
    const date = utcDate(2026, 8, 7);
    vi.setSystemTime(new Date("2026-09-07T06:00:00.000Z"));
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
    const date = utcDate(2026, 8, 7);
    vi.setSystemTime(new Date("2026-09-07T16:00:00.000Z"));
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
    const date = utcDate(2026, 8, 7);
    vi.setSystemTime(new Date("2026-09-07T20:30:00.000Z"));
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

describe("media retention", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sets purge date MEDIA_RETENTION_DAYS after Athens end", () => {
    const date = utcDate(2026, 8, 7);
    const purgeAt = getMediaPurgeAt({ date, endTime: "18:00" });
    // 18:00 Athens = 15:00 UTC
    const endAt = new Date("2026-09-07T15:00:00.000Z");
    const expected = new Date(
      endAt.getTime() + MEDIA_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );
    expect(purgeAt.getTime()).toBe(expected.getTime());
  });

  it("is not expired within the retention window", () => {
    const date = utcDate(2026, 8, 7);
    vi.setSystemTime(new Date("2026-09-10T12:00:00.000Z"));
    expect(
      isMediaRetentionExpired({
        status: EventStatus.COMPLETED,
        date,
        endTime: "18:00",
      }),
    ).toBe(false);
  });

  it("is expired after the retention window", () => {
    const date = utcDate(2026, 8, 7);
    vi.setSystemTime(new Date("2026-11-20T12:00:00.000Z"));
    expect(
      isMediaRetentionExpired({
        status: EventStatus.ACTIVE,
        date,
        endTime: "18:00",
      }),
    ).toBe(true);
  });
});

describe("getEventStartAt / getEventEndAt", () => {
  it("builds Athens start from UTC-midnight calendar date", () => {
    const start = getEventStartAt({
      date: utcDate(2026, 8, 7),
      startTime: "18:00",
    });
    expect(start.toISOString()).toBe("2026-09-07T15:00:00.000Z");
  });

  it("builds Athens end from UTC-midnight calendar date", () => {
    const end = getEventEndAt({
      date: utcDate(2026, 8, 7),
      endTime: "23:00",
    });
    expect(end.toISOString()).toBe("2026-09-07T20:00:00.000Z");
  });

  it("uses endDate calendar day for Athens end", () => {
    const end = getEventEndAt({
      date: utcDate(2026, 8, 7),
      endDate: utcDate(2026, 8, 17),
      endTime: "18:00",
    });
    expect(end.toISOString()).toBe("2026-09-17T15:00:00.000Z");
  });
});
