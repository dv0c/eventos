import {
  OrgMode,
  OrgRole,
  PlatformRole,
  SubscriptionStatus,
  type Organization,
  type Prisma,
} from "@prisma/client";

import { generateUniqueSlug } from "@/lib/slug";
import { prisma } from "@/server/db";
import {
  DEFAULT_PLANS,
  PLATFORM_ADMIN_EMAIL,
  PLATFORM_ORG_NAME,
  PLATFORM_PLAN_SLUG,
  getPlatformOrgSlug,
} from "@/server/plans/default-plans";

function personalOrgName(displayName: string | null | undefined, email: string): string {
  const base = displayName?.trim() || email.split("@")[0] || "My Workspace";
  return base;
}

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
          mode: OrgMode.B2B,
          deletedAt: null,
        },
        create: {
          name: PLATFORM_ORG_NAME,
          slug,
          planId: enterprise.id,
          mode: OrgMode.B2B,
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

  /**
   * Ensures the user owns a personal B2C organization (silent onboarding).
   * Does not auto-join the shared platform org.
   */
  async ensurePersonalOrganization(userId: string): Promise<Organization> {
    const owned = await prisma.organizationMember.findFirst({
      where: {
        userId,
        role: OrgRole.OWNER,
        organization: {
          deletedAt: null,
          mode: OrgMode.B2C,
        },
      },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });

    if (owned?.organization) {
      return owned.organization;
    }

    // Any owned org (including B2B they converted) counts — don't create a second.
    const anyOwned = await prisma.organizationMember.findFirst({
      where: {
        userId,
        role: OrgRole.OWNER,
        organization: { deletedAt: null },
      },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });

    if (anyOwned?.organization) {
      return anyOwned.organization;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const plans = await this.ensurePlans();
    const freePlan = plans.free;
    if (!freePlan) {
      throw new Error("Missing free plan");
    }

    const name = personalOrgName(user.name, user.email);
    const slug = await generateUniqueSlug(name, async (candidate) => {
      const existing = await prisma.organization.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      return existing !== null;
    });

    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name,
          slug,
          mode: OrgMode.B2C,
          planId: freePlan.id,
          members: {
            create: {
              userId,
              role: OrgRole.OWNER,
            },
          },
          subscriptions: {
            create: {
              planId: freePlan.id,
              status: SubscriptionStatus.TRIALING,
            },
          },
        },
      });

      return org;
    });
  },
};
