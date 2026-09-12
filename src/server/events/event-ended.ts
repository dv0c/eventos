import { EventStatus } from "@prisma/client";

export type EventLifecycle = "waiting" | "active" | "ended";

export type EventScheduleFields = {
  status: EventStatus;
  date: Date;
  endDate?: Date | null;
  startTime?: string | null;
  endTime?: string | null;
};

/**
 * Parse "HH:mm" or "HH:mm:ss" into hours/minutes. Returns null if invalid.
 */
function parseClockTime(value: string | null | undefined): {
  hours: number;
  minutes: number;
} | null {
  if (!value?.trim()) return null;
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return { hours, minutes };
}

function utcParts(date: Date): { y: number; m: number; d: number } {
  return {
    y: date.getUTCFullYear(),
    m: date.getUTCMonth(),
    d: date.getUTCDate(),
  };
}

function atUtcClock(
  date: Date,
  hours: number,
  minutes: number,
  seconds = 0,
  ms = 0,
): Date {
  const { y, m, d } = utcParts(date);
  return new Date(Date.UTC(y, m, d, hours, minutes, seconds, ms));
}

function sameUtcDay(a: Date, b: Date): boolean {
  const left = utcParts(a);
  const right = utcParts(b);
  return left.y === right.y && left.m === right.m && left.d === right.d;
}

export function getEventStartAt(event: {
  date: Date;
  startTime?: string | null;
}): Date {
  const parsed = parseClockTime(event.startTime);
  if (parsed) {
    return atUtcClock(event.date, parsed.hours, parsed.minutes);
  }
  return atUtcClock(event.date, 0, 0);
}

export function getEventEndAt(event: {
  date: Date;
  endDate?: Date | null;
  endTime?: string | null;
  startTime?: string | null;
}): Date {
  const endDay = event.endDate ?? event.date;
  const parsed = parseClockTime(event.endTime);
  let end: Date;
  if (parsed) {
    end = atUtcClock(endDay, parsed.hours, parsed.minutes);
  } else {
    end = atUtcClock(endDay, 23, 59, 59, 999);
  }

  // Overnight: end clock is earlier than start on the same calendar day → next UTC day.
  const startParsed = parseClockTime(event.startTime);
  if (parsed && startParsed && sameUtcDay(endDay, event.date)) {
    const endMins = parsed.hours * 60 + parsed.minutes;
    const startMins = startParsed.hours * 60 + startParsed.minutes;
    if (endMins < startMins) {
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  return end;
}

/**
 * Event is considered ended when status is COMPLETED/ARCHIVED,
 * or when the end datetime has passed.
 */
export function isEventEnded(event: EventScheduleFields): boolean {
  if (
    event.status === EventStatus.COMPLETED ||
    event.status === EventStatus.ARCHIVED
  ) {
    return true;
  }

  return Date.now() > getEventEndAt(event).getTime();
}

/**
 * Product-facing lifecycle: Waiting / Active / Ended (not Draft/Planning/etc.).
 */
export function getEventLifecycle(event: EventScheduleFields): EventLifecycle {
  if (isEventEnded(event)) {
    return "ended";
  }
  if (Date.now() < getEventStartAt(event).getTime()) {
    return "waiting";
  }
  return "active";
}

export function isEventWaiting(event: EventScheduleFields): boolean {
  return getEventLifecycle(event) === "waiting";
}

/**
 * Guest photo album upload is allowed only while the event is active.
 */
export function isGuestPhotoUploadAllowed(event: EventScheduleFields): boolean {
  return getEventLifecycle(event) === "active";
}

/** Days after event end before guest media is purged from storage. */
export const MEDIA_RETENTION_DAYS = 30;

export function getMediaPurgeAt(event: {
  date: Date;
  endDate?: Date | null;
  endTime?: string | null;
  startTime?: string | null;
}): Date {
  const endAt = getEventEndAt(event);
  return new Date(endAt.getTime() + MEDIA_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

export function isMediaRetentionExpired(
  event: EventScheduleFields,
  now: Date = new Date(),
): boolean {
  if (!isEventEnded(event)) return false;
  return now.getTime() > getMediaPurgeAt(event).getTime();
}
