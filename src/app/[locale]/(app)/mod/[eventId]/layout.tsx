import { notFound } from "next/navigation";

import { EventThemeScope } from "@/components/events/event-theme-scope";
import { mobileAppViewport } from "@/lib/mobile-app-viewport";
import { requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { AccessError, enforceEventAccess } from "@/server/permissions/enforce";
import { redirect } from "@/i18n/navigation";

export const viewport = mobileAppViewport;

interface ModeratorAppLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; eventId: string }>;
}

export default async function ModeratorAppLayout({
  children,
  params,
}: ModeratorAppLayoutProps) {
  const { locale, eventId } = await params;
  const session = await requireAuth();

  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    include: { theme: true },
  });

  if (!event) {
    notFound();
  }

  try {
    await enforceEventAccess(session.user.id, eventId, "media:manage");
  } catch (error) {
    if (error instanceof AccessError) {
      redirect({ href: "/forbidden", locale });
    }
    throw error;
  }

  return (
    <EventThemeScope
      colors={{
        primaryColor: event.theme?.primaryColor,
        secondaryColor: event.theme?.secondaryColor,
        accentColor: event.theme?.accentColor,
      }}
    >
      {children}
    </EventThemeScope>
  );
}
