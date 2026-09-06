import { EventStatus } from "@prisma/client";

/**
 * Parse "HH:mm" or "HH:mm:ss" into hours/minutes. Returns null if invalid.
 */
function parseEndTime(endTime: string | null | undefined): {
  hours: number;
  minutes: number;
} | null {
  if (!endTime?.trim()) return null;
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(endTime.trim());
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

/**
 * Event is considered ended when status is COMPLETED/ARCHIVED,
 * or when the event date (plus endTime if set, else end of that day) has passed.
 */
export function isEventEnded(event: {
  status: EventStatus;
  date: Date;
  endTime?: string | null;
}): boolean {
  if (
    event.status === EventStatus.COMPLETED ||
    event.status === EventStatus.ARCHIVED
  ) {
    return true;
  }

  const end = new Date(event.date);
  const parsed = parseEndTime(event.endTime);
  if (parsed) {
    end.setHours(parsed.hours, parsed.minutes, 0, 0);
  } else {
    end.setHours(23, 59, 59, 999);
  }

  return Date.now() > end.getTime();
}
