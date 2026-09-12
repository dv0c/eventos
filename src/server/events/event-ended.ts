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

export function getEventStartAt(event: {
  date: Date;
  startTime?: string | null;
}): Date {
  const start = new Date(event.date);
  const parsed = parseClockTime(event.startTime);
  if (parsed) {
    start.setHours(parsed.hours, parsed.minutes, 0, 0);
  } else {
    start.setHours(0, 0, 0, 0);
  }
  return start;
}

export function getEventEndAt(event: {
  date: Date;
  endDate?: Date | null;
  endTime?: string | null;
}): Date {
  const end = new Date(event.endDate ?? event.date);
  const parsed = parseClockTime(event.endTime);
  if (parsed) {
    end.setHours(parsed.hours, parsed.minutes, 0, 0);
  } else {
    end.setHours(23, 59, 59, 999);
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
 * Guest photo album upload is allowed once the event has started,
 * including after it has ended (same QR/token stays valid).
 */
export function isGuestPhotoUploadAllowed(event: EventScheduleFields): boolean {
  return getEventLifecycle(event) !== "waiting";
}

/** Days after event end before guest media is purged from storage. */
export const MEDIA_RETENTION_DAYS = 30;

export function getMediaPurgeAt(event: {
  date: Date;
  endDate?: Date | null;
  endTime?: string | null;
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
