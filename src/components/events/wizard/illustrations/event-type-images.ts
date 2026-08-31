import { EventType } from "@prisma/client";

export const EVENT_TYPE_IMAGES: Record<EventType, string> = {
  [EventType.WEDDING]: "/wizard/event-types/wedding.png",
  [EventType.BAPTISM]: "/wizard/event-types/baptism.png",
  [EventType.BIRTHDAY]: "/wizard/event-types/birthday.png",
  [EventType.ENGAGEMENT]: "/wizard/event-types/engagement.png",
  [EventType.PARTY]: "/wizard/event-types/party.png",
  [EventType.CORPORATE]: "/wizard/event-types/corporate.png",
  [EventType.CONFERENCE]: "/wizard/event-types/conference.png",
  [EventType.OTHER]: "/wizard/event-types/other.png",
};

export const EVENT_TYPE_IMAGE_ALTS: Record<EventType, string> = {
  [EventType.WEDDING]: "Wedding rings icon",
  [EventType.BAPTISM]: "Dove icon",
  [EventType.BIRTHDAY]: "Birthday cake icon",
  [EventType.ENGAGEMENT]: "Engagement ring icon",
  [EventType.PARTY]: "Confetti popper icon",
  [EventType.CORPORATE]: "Briefcase icon",
  [EventType.CONFERENCE]: "Podium icon",
  [EventType.OTHER]: "Calendar icon",
};
