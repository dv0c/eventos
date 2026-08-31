import { redirect } from "@/i18n/navigation";
import { Logo } from "@/components/shared/logo";
import { getSession } from "@/server/auth/session";
import { redirectIfHasOrganizations } from "@/server/auth/organization-guard";

export default async function OnboardingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (!session?.user?.id) {
    redirect({ href: "/login", locale });
  }

  await redirectIfHasOrganizations(locale, session!.user.id);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4 py-12">
      <div className="mb-8">
        <Logo variant="full" size="lg" priority />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
