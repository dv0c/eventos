import { EventStatus } from "@prisma/client";

export type EventLifecycle = "waiting" | "active" | "ended";

/** Wall-clock timezone for event start/end times (product default: Greece). */
export const EVENT_TIME_ZONE = "Europe/Athens";

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

function clockToMinutes(value: string | null | undefined): number | null {
  const parsed = parseClockTime(value);
  if (!parsed) return null;
  return parsed.hours * 60 + parsed.minutes;
}

/**
 * Calendar Y/M/D from a date stored as UTC midnight for a "yyyy-MM-dd" string.
 */
function getCalendarYmd(date: Date): { year: number; monthIndex: number; day: number } {
  return {
    year: date.getUTCFullYear(),
    monthIndex: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

function readZoneParts(utcMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(utcMs));

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/**
 * Convert a wall-clock date/time in `timeZone` to a UTC Date.
 */
export function zonedWallTimeToUtc(
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute: number,
  second = 0,
  millisecond = 0,
  timeZone: string = EVENT_TIME_ZONE,
): Date {
  let utcMs = Date.UTC(year, monthIndex, day, hour, minute, second, millisecond);

  for (let i = 0; i < 4; i++) {
    const parts = readZoneParts(utcMs, timeZone);
    const asIfUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      millisecond,
    );
    const wanted = Date.UTC(year, monthIndex, day, hour, minute, second, millisecond);
    const delta = wanted - asIfUtc;
    if (delta === 0) break;
    utcMs += delta;
  }

  return new Date(utcMs);
}

function addCalendarDays(
  year: number,
  monthIndex: number,
  day: number,
  deltaDays: number,
): { year: number; monthIndex: number; day: number } {
  const next = new Date(Date.UTC(year, monthIndex, day + deltaDays));
  return {
    year: next.getUTCFullYear(),
    monthIndex: next.getUTCMonth(),
    day: next.getUTCDate(),
  };
}

export function getEventStartAt(event: {
  date: Date;
  startTime?: string | null;
}): Date {
  const { year, monthIndex, day } = getCalendarYmd(event.date);
  const parsed = parseClockTime(event.startTime);
  if (parsed) {
    return zonedWallTimeToUtc(
      year,
      monthIndex,
      day,
      parsed.hours,
      parsed.minutes,
      0,
      0,
    );
  }
  return zonedWallTimeToUtc(year, monthIndex, day, 0, 0, 0, 0);
}

export function getEventEndAt(event: {
  date: Date;
  startTime?: string | null;
  endTime?: string | null;
}): Date {
  let { year, monthIndex, day } = getCalendarYmd(event.date);
  const parsed = parseClockTime(event.endTime);

  if (parsed) {
    const startMinutes = clockToMinutes(event.startTime);
    const endMinutes = parsed.hours * 60 + parsed.minutes;
    if (startMinutes !== null && endMinutes <= startMinutes) {
      ({ year, monthIndex, day } = addCalendarDays(year, monthIndex, day, 1));
    }
    return zonedWallTimeToUtc(
      year,
      monthIndex,
      day,
      parsed.hours,
      parsed.minutes,
      0,
      0,
    );
  }

  return zonedWallTimeToUtc(year, monthIndex, day, 23, 59, 59, 999);
}

/**
 * Event is considered ended when status is COMPLETED/ARCHIVED,
 * or when the event date (plus endTime if set, else end of that day) has passed.
 */
export function isEventEnded(event: {
  status: EventStatus;
  date: Date;
  startTime?: string | null;
  endTime?: string | null;
}): boolean {
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
export function getEventLifecycle(event: {
  status: EventStatus;
  date: Date;
  startTime?: string | null;
  endTime?: string | null;
}): EventLifecycle {
  if (isEventEnded(event)) {
    return "ended";
  }
  if (Date.now() < getEventStartAt(event).getTime()) {
    return "waiting";
  }
  return "active";
}

export function isEventWaiting(event: {
  status: EventStatus;
  date: Date;
  startTime?: string | null;
  endTime?: string | null;
}): boolean {
  return getEventLifecycle(event) === "waiting";
}

/**
 * Guest photo album upload is allowed once the event has started,
 * including after it has ended (same QR/token stays valid).
 */
export function isGuestPhotoUploadAllowed(event: {
  status: EventStatus;
  date: Date;
  startTime?: string | null;
  endTime?: string | null;
}): boolean {
  return getEventLifecycle(event) !== "waiting";
}
