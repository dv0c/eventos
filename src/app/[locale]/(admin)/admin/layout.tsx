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

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive">
        Admin area — platform management
      </div>
      {children}
    </div>
  );
}
