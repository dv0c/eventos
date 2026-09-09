import { AuditAction, Locale, type User as PrismaUser } from "@prisma/client";
import type { User as MeindeskUser } from "@meindesk/sdk";

import { prisma } from "@/server/db";
import { auditService } from "@/server/services/audit.service";
import { platformOrgService } from "@/server/services/platform-org.service";

function displayName(user: MeindeskUser): string | null {
  const parts = [user.firstName, user.lastName].filter(
    (part): part is string => Boolean(part?.trim()),
  );
  if (parts.length > 0) {
    return parts.join(" ").trim();
  }
  return user.username?.trim() || null;
}

/**
 * Resolve or create the local Eventos user for a Meindesk identity.
 * Prefer meindeskUserId; fall back to email for pre-migration rows.
 */
export async function syncLocalUserFromMeindesk(
  meindeskUser: MeindeskUser,
): Promise<PrismaUser> {
  const email = meindeskUser.email.trim().toLowerCase();
  const name = displayName(meindeskUser);
  const image = meindeskUser.imageUrl ?? null;
  const emailVerified = meindeskUser.emailVerifiedAt
    ? new Date(meindeskUser.emailVerifiedAt)
    : null;

  const byMeindeskId = await prisma.user.findUnique({
    where: { meindeskUserId: meindeskUser.id },
  });

  if (byMeindeskId) {
    if (byMeindeskId.deletedAt) {
      throw new Error("USER_DELETED");
    }

    return prisma.user.update({
      where: { id: byMeindeskId.id },
      data: {
        email,
        ...(name ? { name } : {}),
        ...(image !== undefined ? { image } : {}),
        ...(emailVerified ? { emailVerified } : {}),
      },
    });
  }

  const byEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (byEmail) {
    if (byEmail.deletedAt) {
      throw new Error("USER_DELETED");
    }

    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        meindeskUserId: meindeskUser.id,
        ...(name ? { name } : {}),
        ...(image !== undefined ? { image } : {}),
        ...(emailVerified ? { emailVerified } : {}),
      },
    });
  }

  const created = await prisma.user.create({
    data: {
      meindeskUserId: meindeskUser.id,
      email,
      name,
      image,
      emailVerified,
      locale: Locale.el,
    },
  });

  await platformOrgService.ensurePersonalOrganization(created.id);

  await auditService.logAudit({
    userId: created.id,
    action: AuditAction.USER_LOGIN,
    entity: "User",
    entityId: created.id,
  });

  return created;
}
