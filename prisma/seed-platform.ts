/**
 * Lean seed for production: plans + shared platform organization only.
 * Does not create demo wedding data.
 *
 * Usage: npm run db:seed:platform
 */
import { PrismaClient, OrgRole, PlatformRole, SubscriptionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  DEFAULT_PLANS,
  PLATFORM_ADMIN_EMAIL,
  PLATFORM_ORG_NAME,
  PLATFORM_PLAN_SLUG,
  getPlatformOrgSlug,
} from "../src/server/plans/default-plans";

const prisma = new PrismaClient();
const ADMIN_PASSWORD = process.env.PLATFORM_ADMIN_PASSWORD ?? "demo123456";

async function seedPlans() {
  const plans: Record<string, { id: string }> = {};
  for (const plan of DEFAULT_PLANS) {
    const created = await prisma.plan.upsert({
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
}

async function main() {
  const slug = getPlatformOrgSlug();
  console.log(`Seeding platform tenant (slug=${slug})...`);

  const plans = await seedPlans();
  console.log(`✓ ${DEFAULT_PLANS.length} plans`);

  const enterprise = plans[PLATFORM_PLAN_SLUG];
  if (!enterprise) {
    throw new Error(`Missing ${PLATFORM_PLAN_SLUG} plan`);
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await prisma.user.upsert({
    where: { email: PLATFORM_ADMIN_EMAIL },
    update: {
      name: "Eventos Admin",
      platformRole: PlatformRole.ADMIN,
      passwordHash,
    },
    create: {
      email: PLATFORM_ADMIN_EMAIL,
      name: "Eventos Admin",
      platformRole: PlatformRole.ADMIN,
      passwordHash,
    },
  });
  console.log(`✓ Platform admin: ${PLATFORM_ADMIN_EMAIL}`);

  const org = await prisma.organization.upsert({
    where: { slug },
    update: {
      name: PLATFORM_ORG_NAME,
      planId: enterprise.id,
      mode: "B2B",
      deletedAt: null,
    },
    create: {
      name: PLATFORM_ORG_NAME,
      slug,
      planId: enterprise.id,
      mode: "B2B",
    },
  });
  console.log(`✓ Organization: ${org.name} (${org.slug})`);

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: { organizationId: org.id, userId: admin.id },
    },
    update: { role: OrgRole.OWNER },
    create: {
      organizationId: org.id,
      userId: admin.id,
      role: OrgRole.OWNER,
    },
  });

  const existingSub = await prisma.subscription.findFirst({
    where: { organizationId: org.id },
  });
  if (!existingSub) {
    await prisma.subscription.create({
      data: {
        organizationId: org.id,
        planId: enterprise.id,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }

  console.log("✓ Platform seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
