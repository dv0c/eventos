import { notFound } from "next/navigation";

import { DjBoothShell } from "@/components/media/album/dj-booth-shell";
import { redirect } from "@/i18n/navigation";
import { requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { AccessError, enforceEventAccess } from "@/server/permissions/enforce";

interface DjBoothPageProps {
  params: Promise<{ locale: string; eventId: string }>;
}

export default async function DjBoothPage({ params }: DjBoothPageProps) {
  const { locale, eventId } = await params;
  const session = await requireAuth();

  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    select: { id: true, name: true },
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

  return <DjBoothShell eventId={event.id} eventName={event.name} />;
}
