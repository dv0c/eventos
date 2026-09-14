import { EventStatus, PlatformRole } from "@prisma/client";
import { getTranslations } from "next-intl/server";

import { DayzerDashboardShell } from "@/components/dashboard/dayzer/dayzer-dashboard-shell";
import type {
  DayzerDashboardData,
  DayzerEventItem,
  DayzerMember,
} from "@/components/dashboard/dayzer/types";
import { formatDate } from "@/lib/format";
import { orgPath } from "@/lib/org-path";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { getEventLifecycle } from "@/server/events/event-ended";
import { can } from "@/server/permissions/matrix";
import { getStorageProvider } from "@/server/providers/storage";
import { organizationRepository } from "@/server/repositories/organization.repository";
import { eventService } from "@/server/services/event.service";

function toEventItem(
  event: {
    id: string;
    name: string;
    date: Date;
    location?: string | null;
    client?: { name: string } | null;
    status: EventStatus;
    startTime?: string | null;
    endTime?: string | null;
    endDate?: Date | null;
    theme?: { coverImageKey?: string | null } | null;
  },
  orgSlug: string,
  locale: string,
): DayzerEventItem {
  const storage = getStorageProvider();
  const coverKey = event.theme?.coverImageKey ?? null;
  return {
    id: event.id,
    name: event.name,
    dateLabel: formatDate(event.date, locale as "el" | "en"),
    location: event.location ?? null,
    clientName: event.client?.name ?? null,
    lifecycle: getEventLifecycle(event),
    overviewHref: orgPath(orgSlug, `/events/${event.id}/overview`),
    guestsHref: orgPath(orgSlug, `/events/${event.id}/guests`),
    messagesHref: orgPath(orgSlug, `/events/${event.id}/messages`),
    wallHref: orgPath(orgSlug, `/events/${event.id}/media`),
    coverUrl: coverKey ? storage.getPublicUrl(coverKey) : null,
  };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { locale, orgSlug } = await params;
  const tDash = await getTranslations("dashboard");
  const session = await requireAuth();
  const org = await getOrganizationBySlug(session.user.id, orgSlug);

  const [{ events }, members] = await Promise.all([
    eventService.listEvents(session.user.id, {
      organizationId: org.id,
      pageSize: 50,
    }),
    organizationRepository.getMembers(org.id),
  ]);

  const attention = events.filter((e) => e.status === EventStatus.DRAFT);
  const upcomingLive = events.filter((e) => {
    if (e.status === EventStatus.DRAFT) return false;
    const life = getEventLifecycle(e);
    return life === "waiting" || life === "active";
  });

  const featuredRaw = upcomingLive[0] ?? attention[0] ?? events[0] ?? null;

  let featuredStats: DayzerDashboardData["featuredStats"] = null;
  if (featuredRaw) {
    try {
      const overview = await eventService.getEventOverview(
        session.user.id,
        featuredRaw.id,
      );
      featuredStats = {
        guestCount: overview.stats.guestCount,
        photoCount: overview.stats.totalMedia,
        totalTasks: overview.stats.totalTasks,
        completedTasks: overview.stats.completedTasks,
        daysUntilEvent: overview.stats.daysUntilEvent,
      };
    } catch {
      featuredStats = null;
    }
  }

  const featured = featuredRaw
    ? toEventItem(featuredRaw, orgSlug, locale)
    : null;

  const listSource =
    upcomingLive.length > 0
      ? upcomingLive
      : events.filter((e) => e.id !== featuredRaw?.id);

  const nestedSource = (upcomingLive.length > 0 ? upcomingLive : events).slice(
    0,
    4,
  );

  const dayzerMembers: DayzerMember[] = members.map((m) => ({
    id: m.id,
    name: m.user.name,
    email: m.user.email,
    image: m.user.image,
  }));

  const canBilling = can(org.role, "org:manage_billing");
  const isAdmin = session.user.platformRole === PlatformRole.ADMIN;

  const firstName =
    session.user.name?.trim().split(/\s+/)[0] ||
    session.user.email?.split("@")[0] ||
    tDash("accountFallback");

  const data: DayzerDashboardData = {
    user: {
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
    },
    orgSlug,
    orgRoleLabel: org.role,
    brandName: org.brandName?.trim() || org.name,
    nestedEvents: nestedSource.map((e) => toEventItem(e, orgSlug, locale)),
    listEvents: listSource
      .slice(0, 3)
      .map((e) => toEventItem(e, orgSlug, locale)),
    featured,
    featuredStats,
    members: dayzerMembers,
    createEventHref: orgPath(orgSlug, "/events/new"),
    eventsHref: orgPath(orgSlug, "/events"),
    teamHref: orgPath(orgSlug, "/team"),
    settingsHref: orgPath(orgSlug, "/settings"),
    billingHref: canBilling ? orgPath(orgSlug, "/billing") : null,
    adminHref: isAdmin ? "/admin" : null,
    firstName,
  };

  return <DayzerDashboardShell data={data} />;
}
