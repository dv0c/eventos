import { redirect } from "@/i18n/navigation";

interface GuestsPageProps {
  params: Promise<{ locale: string; orgSlug: string; eventId: string }>;
}

export default async function EventGuestsPage({ params }: GuestsPageProps) {
  const { locale, orgSlug, eventId } = await params;
  redirect({ href: `/org/${orgSlug}/events/${eventId}/overview`, locale });
}
