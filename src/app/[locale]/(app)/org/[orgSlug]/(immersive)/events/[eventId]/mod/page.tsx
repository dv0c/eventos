import { redirect } from "@/i18n/navigation";

interface EventModeratorRedirectProps {
  params: Promise<{ locale: string; eventId: string }>;
}

/** Legacy org-scoped URL — redirects to the account-gated mod app. */
export default async function EventModeratorRedirectPage({
  params,
}: EventModeratorRedirectProps) {
  const { locale, eventId } = await params;
  redirect({ href: `/mod/${eventId}`, locale });
}
