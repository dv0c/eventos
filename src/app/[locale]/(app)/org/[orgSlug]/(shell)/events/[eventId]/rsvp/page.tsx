import { redirect } from "@/i18n/navigation";

interface RsvpPageProps {
  params: Promise<{ locale: string; orgSlug: string; eventId: string }>;
}

export default async function EventRsvpPage({ params }: RsvpPageProps) {
  const { locale, orgSlug, eventId } = await params;
  redirect({ href: `/org/${orgSlug}/events/${eventId}/overview`, locale });
}
