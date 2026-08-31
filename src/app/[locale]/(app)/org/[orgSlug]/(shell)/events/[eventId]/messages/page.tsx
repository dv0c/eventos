import { redirect } from "@/i18n/navigation";

interface MessagesPageProps {
  params: Promise<{ locale: string; orgSlug: string; eventId: string }>;
}

export default async function EventMessagesPage({ params }: MessagesPageProps) {
  const { locale, orgSlug, eventId } = await params;
  redirect({ href: `/org/${orgSlug}/events/${eventId}/overview`, locale });
}
