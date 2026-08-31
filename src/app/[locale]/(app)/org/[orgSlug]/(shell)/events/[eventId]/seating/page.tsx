import { redirect } from "@/i18n/navigation";

interface SeatingPageProps {
  params: Promise<{ locale: string; orgSlug: string; eventId: string }>;
}

export default async function EventSeatingPage({ params }: SeatingPageProps) {
  const { locale, orgSlug, eventId } = await params;
  redirect({ href: `/org/${orgSlug}/events/${eventId}/overview`, locale });
}
