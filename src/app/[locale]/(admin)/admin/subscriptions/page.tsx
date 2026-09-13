import { redirect } from "@/i18n/navigation";

export default async function AdminSubscriptionsRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/admin/billing?tab=subscriptions", locale });
}
