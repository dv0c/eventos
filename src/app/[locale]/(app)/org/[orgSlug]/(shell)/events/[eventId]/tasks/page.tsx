import { redirect } from "@/i18n/navigation";

interface TasksPageProps {
  params: Promise<{ locale: string; orgSlug: string; eventId: string }>;
}

export default async function EventTasksPage({ params }: TasksPageProps) {
  const { locale, orgSlug, eventId } = await params;
  redirect({ href: `/org/${orgSlug}/events/${eventId}/overview`, locale });
}
