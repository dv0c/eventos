import { notFound } from "next/navigation";

import { DayzerDashboardShell } from "@/components/dashboard/dayzer/dayzer-dashboard-shell";
import type { DayzerDashboardData } from "@/components/dashboard/dayzer/types";

/**
 * Dev-only geometry preview for Dayzer dashboard visual QA.
 * Not linked from production navigation.
 */
export default function DayzerDevPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const data: DayzerDashboardData = {
    user: {
      name: "Alex Host",
      email: "alex@evento.app",
      image: null,
    },
    orgSlug: "preview",
    orgRoleLabel: "OWNER",
    brandName: "Evento",
    nestedEvents: [
      {
        id: "1",
        name: "Maria & Nikos",
        dateLabel: "12 Jun 2026",
        location: "Athens",
        clientName: null,
        lifecycle: "waiting",
        overviewHref: "#",
        guestsHref: "#",
        messagesHref: "#",
        wallHref: "#",
        coverUrl: null,
      },
      {
        id: "2",
        name: "Elena Baptism",
        dateLabel: "3 Jul 2026",
        location: null,
        clientName: null,
        lifecycle: "waiting",
        overviewHref: "#",
        guestsHref: "#",
        messagesHref: "#",
        wallHref: "#",
        coverUrl: null,
      },
      {
        id: "3",
        name: "Office Party",
        dateLabel: "18 Jul 2026",
        location: null,
        clientName: null,
        lifecycle: "active",
        overviewHref: "#",
        guestsHref: "#",
        messagesHref: "#",
        wallHref: "#",
        coverUrl: null,
      },
      {
        id: "4",
        name: "Private Dinner",
        dateLabel: "22 Aug 2026",
        location: null,
        clientName: null,
        lifecycle: "waiting",
        overviewHref: "#",
        guestsHref: "#",
        messagesHref: "#",
        wallHref: "#",
        coverUrl: null,
      },
    ],
    listEvents: [
      {
        id: "1",
        name: "Messaging ID framework development for the marketing branch",
        dateLabel: "Today",
        location: null,
        clientName: "Marketing",
        lifecycle: "active",
        overviewHref: "#",
        guestsHref: "#",
        messagesHref: "#",
        wallHref: "#",
        coverUrl: null,
      },
      {
        id: "2",
        name: "Guest list review with the venue",
        dateLabel: "4h",
        location: null,
        clientName: "Grace Aroma",
        lifecycle: "waiting",
        overviewHref: "#",
        guestsHref: "#",
        messagesHref: "#",
        wallHref: "#",
        coverUrl: null,
      },
      {
        id: "3",
        name: "Photo wall setup checklist",
        dateLabel: "3h",
        location: null,
        clientName: "Petz App",
        lifecycle: "waiting",
        overviewHref: "#",
        guestsHref: "#",
        messagesHref: "#",
        wallHref: "#",
        coverUrl: null,
      },
    ],
    featured: {
      id: "1",
      name: "Messaging ID framework development for the marketing branch",
      dateLabel: "Today",
      location: null,
      clientName: "Marketing",
      lifecycle: "active",
      overviewHref: "#",
      guestsHref: "#",
      messagesHref: "#",
      wallHref: "#",
      coverUrl: null,
    },
    featuredStats: {
      guestCount: 128,
      photoCount: 42,
      totalTasks: 6,
      completedTasks: 4,
      daysUntilEvent: 0,
    },
    members: [
      { id: "m1", name: "Alex Host", email: "a@e.app", image: null },
      { id: "m2", name: "Sam Planner", email: "s@e.app", image: null },
      { id: "m3", name: "Jo Media", email: "j@e.app", image: null },
    ],
    createEventHref: "#",
    eventsHref: "#",
    teamHref: "#",
    settingsHref: "#",
    billingHref: null,
    adminHref: null,
    firstName: "Alex",
  };

  return <DayzerDashboardShell data={data} />;
}
