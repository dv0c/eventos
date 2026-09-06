import {
  OrgRole,
  PlatformRole,
  SubscriptionStatus,
  type Organization,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/server/db";
import {
  DEFAULT_PLANS,
  PLATFORM_ADMIN_EMAIL,
  PLATFORM_ORG_NAME,
  PLATFORM_PLAN_SLUG,
  getPlatformOrgSlug,
} from "@/server/plans/default-plans";

export const platformOrgService = {
  async ensurePlans(
    tx: Prisma.TransactionClient | typeof prisma = prisma,
  ): Promise<Record<string, { id: string }>> {
    const plans: Record<string, { id: string }> = {};

    for (const plan of DEFAULT_PLANS) {
      const created = await tx.plan.upsert({
        where: { slug: plan.slug },
        update: {
          name: plan.name,
          description: plan.description,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
          limits: plan.limits,
          sortOrder: plan.sortOrder,
          isActive: true,
        },
        create: {
          name: plan.name,
          slug: plan.slug,
          description: plan.description,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
          limits: plan.limits,
          sortOrder: plan.sortOrder,
        },
      });
      plans[plan.slug] = created;
    }

    return plans;
  },

  async ensurePlatformOrganization(): Promise<Organization> {
    const slug = getPlatformOrgSlug();
    const existing = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existing && !existing.deletedAt) {
      return existing;
    }

    const plans = await this.ensurePlans();
    const enterprise = plans[PLATFORM_PLAN_SLUG];
    if (!enterprise) {
      throw new Error(`Missing plan slug: ${PLATFORM_PLAN_SLUG}`);
    }

    const admin = await prisma.user.findUnique({
      where: { email: PLATFORM_ADMIN_EMAIL },
    });

    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.upsert({
        where: { slug },
        update: {
          name: PLATFORM_ORG_NAME,
          planId: enterprise.id,
          deletedAt: null,
        },
        create: {
          name: PLATFORM_ORG_NAME,
          slug,
          planId: enterprise.id,
        },
      });

      const subscription = await tx.subscription.findFirst({
        where: { organizationId: org.id },
        orderBy: { createdAt: "desc" },
      });

      if (!subscription) {
        await tx.subscription.create({
          data: {
            organizationId: org.id,
            planId: enterprise.id,
            status: SubscriptionStatus.ACTIVE,
          },
        });
      }

      if (admin) {
        await tx.organizationMember.upsert({
          where: {
            organizationId_userId: {
              organizationId: org.id,
              userId: admin.id,
            },
          },
          update: { role: OrgRole.OWNER },
          create: {
            organizationId: org.id,
            userId: admin.id,
            role: OrgRole.OWNER,
          },
        });

        if (admin.platformRole !== PlatformRole.ADMIN) {
          await tx.user.update({
            where: { id: admin.id },
            data: { platformRole: PlatformRole.ADMIN },
          });
        }
      }

      return org;
    });
  },

  async ensurePlatformMembership(userId: string): Promise<Organization> {
    const org = await this.ensurePlatformOrganization();

    const existing = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId,
        },
      },
    });

    if (!existing) {
      await prisma.organizationMember.create({
        data: {
          organizationId: org.id,
          userId,
          role: OrgRole.EDITOR,
        },
      });
    }

    return org;
  },
};
