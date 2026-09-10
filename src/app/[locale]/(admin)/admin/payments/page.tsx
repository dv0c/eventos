import { redirect } from "@/i18n/navigation";

export default async function AdminPaymentsRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/admin/billing?tab=invoices", locale });
}
