import { PlatformRole } from "@prisma/client";

import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (
    !session?.user?.id ||
    session.user.platformRole !== PlatformRole.ADMIN
  ) {
    redirect({ href: "/dashboard", locale });
  }

  return <>{children}</>;
}
