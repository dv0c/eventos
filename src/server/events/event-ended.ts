import { EventStatus } from "@prisma/client";

/** Product badge mapping: idle→waiting, live/paused→active, stopped/locked→ended. */
export type EventLifecycle = "waiting" | "active" | "ended";

/** Explicit run phase driven by Start / Pause / Stop. */
export type EventRunPhase = "idle" | "live" | "paused" | "stopped" | "locked";

/** Wall-clock timezone for event calendar day display (product default: Greece). */
export const EVENT_TIME_ZONE = "Europe/Athens";

export const LIVE_WINDOW_DAYS = 7;
/** @deprecated Restart after stop is no longer allowed; kept for snapshot compat. */
export const RESTART_GRACE_DAYS = 0;
/** Days after stop/lock before guest media is purged from storage. */
export const MEDIA_RETENTION_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export type EventRunFields = {
  status: EventStatus;
  liveStartedAt?: Date | null;
  pausedAt?: Date | null;
  stoppedAt?: Date | null;
  lockedAt?: Date | null;
  /** @deprecated schedule end — kept for migration / calendar display */
  date?: Date | null;
  endDate?: Date | null;
  startTime?: string | null;
  endTime?: string | null;
};

/** @deprecated Use EventRunFields — schedule fields no longer drive lifecycle. */
export type EventScheduleFields = EventRunFields & {
  date: Date;
};

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * DAY_MS);
}

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

/** Calendar-day start for display / scheduled auto-start. */
export function getEventStartAt(event: {
  date: Date | null | undefined;
  startTime?: string | null;
}): Date | null {
  if (!event.date) return null;
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

/**
 * @deprecated Prefer run deadlines. Kept for calendar/legacy display.
 */
export function getEventEndAt(event: {
  date: Date | null | undefined;
  endDate?: Date | null;
  endTime?: string | null;
  startTime?: string | null;
}): Date | null {
  const base = event.endDate ?? event.date;
  if (!base) return null;
  let { year, monthIndex, day } = getCalendarYmd(base);
  const parsed = parseClockTime(event.endTime);

  if (parsed) {
    if (!event.endDate && event.date) {
      const startMinutes = clockToMinutes(event.startTime);
      const endMinutes = parsed.hours * 60 + parsed.minutes;
      if (startMinutes !== null && endMinutes <= startMinutes) {
        ({ year, monthIndex, day } = addCalendarDays(year, monthIndex, day, 1));
      }
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

export function getLiveDeadlineAt(event: {
  liveStartedAt?: Date | null;
}): Date | null {
  if (!event.liveStartedAt) return null;
  return addDays(event.liveStartedAt, LIVE_WINDOW_DAYS);
}

export function getRestartDeadlineAt(_event: {
  stoppedAt?: Date | null;
}): Date | null {
  // Restart after stop is disabled.
  return null;
}

export function getEventRunPhase(
  event: EventRunFields,
  now: Date = new Date(),
): EventRunPhase {
  if (event.lockedAt || event.status === EventStatus.ARCHIVED) {
    return "locked";
  }

  const nowMs = now.getTime();

  // Live window expired while still "running" → treat as locked for phase
  // (jobs will persist stoppedAt / lockedAt / COMPLETED).
  if (event.liveStartedAt && !event.stoppedAt) {
    const liveDeadline = getLiveDeadlineAt(event);
    if (liveDeadline && nowMs > liveDeadline.getTime()) {
      return "locked";
    }
    if (event.pausedAt) return "paused";
    return "live";
  }

  if (event.stoppedAt || event.status === EventStatus.COMPLETED) {
    return "locked";
  }

  return "idle";
}

export function canStartEvent(
  event: EventRunFields,
  now: Date = new Date(),
): boolean {
  return getEventRunPhase(event, now) === "idle";
}

export function canPauseEvent(
  event: EventRunFields,
  now: Date = new Date(),
): boolean {
  return getEventRunPhase(event, now) === "live";
}

export function canResumeEvent(
  event: EventRunFields,
  now: Date = new Date(),
): boolean {
  return getEventRunPhase(event, now) === "paused";
}

export function canStopEvent(
  event: EventRunFields,
  now: Date = new Date(),
): boolean {
  const phase = getEventRunPhase(event, now);
  return phase === "live" || phase === "paused";
}

/**
 * Event is ended for host "completed" surfaces when stopped or locked.
 */
export function isEventEnded(
  event: EventRunFields,
  now: Date = new Date(),
): boolean {
  const phase = getEventRunPhase(event, now);
  return phase === "stopped" || phase === "locked";
}

/**
 * Product-facing lifecycle for existing badges: Waiting / Active / Ended.
 */
export function getEventLifecycle(
  event: EventRunFields,
  now: Date = new Date(),
): EventLifecycle {
  const phase = getEventRunPhase(event, now);
  if (phase === "idle") return "waiting";
  if (phase === "live" || phase === "paused") return "active";
  return "ended";
}

export function isEventWaiting(
  event: EventRunFields,
  now: Date = new Date(),
): boolean {
  return getEventRunPhase(event, now) === "idle";
}

/**
 * Guest photo album upload only while live (not paused / idle / stopped / locked).
 */
export function isGuestPhotoUploadAllowed(
  event: EventRunFields,
  now: Date = new Date(),
): boolean {
  return getEventRunPhase(event, now) === "live";
}

/** Guests may use wall / wishes only while live. */
export function isGuestLiveFeaturesAllowed(
  event: EventRunFields,
  now: Date = new Date(),
): boolean {
  return getEventRunPhase(event, now) === "live";
}

export function getMediaPurgeAt(event: {
  stoppedAt?: Date | null;
  lockedAt?: Date | null;
  date?: Date | null;
  endDate?: Date | null;
  endTime?: string | null;
  startTime?: string | null;
}): Date | null {
  const anchor = event.lockedAt ?? event.stoppedAt;
  if (anchor) {
    return addDays(anchor, MEDIA_RETENTION_DAYS);
  }
  // Legacy fallback for events ended via schedule/status only
  if (event.date) {
    const endAt = getEventEndAt({
      date: event.date,
      endDate: event.endDate,
      endTime: event.endTime,
      startTime: event.startTime,
    });
    if (!endAt) return null;
    return addDays(endAt, MEDIA_RETENTION_DAYS);
  }
  return null;
}

export function isMediaRetentionExpired(
  event: EventRunFields,
  now: Date = new Date(),
): boolean {
  if (!isEventEnded(event, now)) return false;
  const purgeAt = getMediaPurgeAt(event);
  if (!purgeAt) return false;
  return now.getTime() > purgeAt.getTime();
}
