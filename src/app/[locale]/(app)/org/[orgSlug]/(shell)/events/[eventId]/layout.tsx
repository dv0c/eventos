import { notFound } from "next/navigation";

import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { eventRepository } from "@/server/repositories/event.repository";

interface EventLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; orgSlug: string; eventId: string }>;
}

export default async function EventLayout({
  children,
  params,
}: EventLayoutProps) {
  const { eventId, orgSlug } = await params;
  const session = await requireAuth();
  const organization = await getOrganizationBySlug(session.user.id, orgSlug);
  const event = await eventRepository.findById(organization.id, eventId);

  if (!event) {
    notFound();
  }

  return <div className="space-y-6">{children}</div>;
}
