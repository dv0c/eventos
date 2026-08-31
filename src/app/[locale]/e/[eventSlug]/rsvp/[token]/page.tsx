import { redirect } from "@/i18n/navigation";

interface PublicRsvpPageProps {
  params: Promise<{ locale: string; eventSlug: string; token: string }>;
}

export default async function PublicRsvpPage({ params }: PublicRsvpPageProps) {
  const { locale, eventSlug } = await params;
  redirect({ href: `/e/${eventSlug}`, locale });
}
