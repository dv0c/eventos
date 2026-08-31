import { InviteStatus } from "@prisma/client";
import { getTranslations } from "next-intl/server";

import {
  AcceptInviteButton,
  InviteLoginPrompt,
} from "@/components/organization/accept-invite-button";
import { Logo } from "@/components/shared/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/server/auth/session";
import { prisma } from "@/server/db";

interface InvitePageProps {
  params: Promise<{ locale: string; token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const t = await getTranslations("invite");
  const session = await getSession();

  const invite = await prisma.organizationInvite.findUnique({
    where: { token },
    include: {
      organization: {
        select: { name: true, slug: true },
      },
    },
  });

  if (
    !invite ||
    invite.status !== InviteStatus.PENDING ||
    invite.expiresAt < new Date()
  ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4 py-12">
        <div className="mb-8">
          <Logo variant="full" size="lg" priority />
        </div>
        <Card className="surface-elevated w-full max-w-md border-border/60 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("invalidTitle")}</CardTitle>
            <CardDescription>{t("invalid")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const emailMatches =
    session?.user?.email &&
    session.user.email.toLowerCase() === invite.email.toLowerCase();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4 py-12">
      <div className="mb-8">
        <Logo variant="full" size="lg" priority />
      </div>
      <Card className="surface-elevated w-full max-w-md border-border/60 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>
            {t("description", { orgName: invite.organization.name })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            {t("invitedAs", { email: invite.email, role: invite.role })}
          </p>
          {session?.user?.id && emailMatches ? (
            <AcceptInviteButton token={token} />
          ) : session?.user?.id ? (
            <p className="text-sm text-destructive">{t("emailMismatch")}</p>
          ) : (
            <InviteLoginPrompt token={token} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
