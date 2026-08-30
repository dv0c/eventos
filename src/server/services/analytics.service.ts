import { prisma } from "@/server/db";
import { enforceOrganizationAccess } from "@/server/permissions/enforce";

export interface AnalyticsData {
  rsvpConversion: Array<{ name: string; invited: number; responded: number; rate: number }>;
  messageDelivery: Array<{ status: string; count: number }>;
  photoUploads: Array<{ date: string; count: number }>;
  summary: {
    totalEvents: number;
    totalGuests: number;
    rsvpRate: number;
    messagesSent: number;
    photosUploaded: number;
  };
}

export const analyticsService = {
  async getOrganizationAnalytics(
    userId: string,
    organizationId: string,
  ): Promise<AnalyticsData> {
    await enforceOrganizationAccess(userId, organizationId, "org:read");

    const events = await prisma.event.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        name: true,
        guests: {
          where: { deletedAt: null },
          select: { status: true },
        },
      },
    });

    const rsvpConversion = events.map((event) => {
      const invited = event.guests.filter((g) =>
        ["INVITED", "CONFIRMED", "DECLINED", "MAYBE", "NO_RESPONSE"].includes(g.status),
      ).length;
      const responded = event.guests.filter((g) =>
        ["CONFIRMED", "DECLINED", "MAYBE"].includes(g.status),
      ).length;
      return {
        name: event.name,
        invited,
        responded,
        rate: invited > 0 ? Math.round((responded / invited) * 100) : 0,
      };
    });

    const messageDeliveryRaw = await prisma.messageDelivery.groupBy({
      by: ["status"],
      where: {
        message: { event: { organizationId, deletedAt: null } },
      },
      _count: { _all: true },
    });

    const messageDelivery = messageDeliveryRaw.map((row) => ({
      status: row.status,
      count: row._count._all,
    }));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mediaItems = await prisma.media.findMany({
      where: {
        event: { organizationId, deletedAt: null },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const uploadsByDate = new Map<string, number>();
    for (const item of mediaItems) {
      const key = item.createdAt.toISOString().slice(0, 10);
      uploadsByDate.set(key, (uploadsByDate.get(key) ?? 0) + 1);
    }

    const photoUploads = Array.from(uploadsByDate.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    const totalGuests = events.reduce((sum, e) => sum + e.guests.length, 0);
    const totalResponded = rsvpConversion.reduce((sum, e) => sum + e.responded, 0);
    const totalInvited = rsvpConversion.reduce((sum, e) => sum + e.invited, 0);

    const messagesSent = await prisma.message.count({
      where: { event: { organizationId, deletedAt: null } },
    });

    const photosUploaded = await prisma.media.count({
      where: { event: { organizationId, deletedAt: null } },
    });

    return {
      rsvpConversion,
      messageDelivery,
      photoUploads,
      summary: {
        totalEvents: events.length,
        totalGuests,
        rsvpRate: totalInvited > 0 ? Math.round((totalResponded / totalInvited) * 100) : 0,
        messagesSent,
        photosUploaded,
      },
    };
  },
};
