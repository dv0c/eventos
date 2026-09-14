import type { EventLifecycle } from "@/server/events/event-ended";

export interface DayzerMember {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface DayzerEventItem {
  id: string;
  name: string;
  dateLabel: string;
  location: string | null;
  clientName: string | null;
  lifecycle: EventLifecycle;
  overviewHref: string;
  guestsHref: string;
  messagesHref: string;
  wallHref: string;
  coverUrl: string | null;
}

export interface DayzerFeaturedStats {
  guestCount: number;
  photoCount: number;
  totalTasks: number;
  completedTasks: number;
  daysUntilEvent: number | null;
}

export interface DayzerDashboardData {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  orgSlug: string;
  orgRoleLabel: string;
  brandName: string;
  nestedEvents: DayzerEventItem[];
  listEvents: DayzerEventItem[];
  featured: DayzerEventItem | null;
  featuredStats: DayzerFeaturedStats | null;
  members: DayzerMember[];
  createEventHref: string;
  eventsHref: string;
  teamHref: string;
  settingsHref: string;
  billingHref: string | null;
  adminHref: string | null;
  firstName: string;
}
