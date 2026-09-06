import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const org = await prisma.organization.findUnique({ where: { slug: "eventos" } });
if (!org) {
  throw new Error("Platform organization (slug=eventos) not found. Run db:seed:platform first.");
}

const users = await prisma.user.findMany({
  where: { deletedAt: null },
  select: { id: true },
});

let enrolled = 0;
for (const user of users) {
  const existing = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: user.id,
      },
    },
  });

  if (!existing) {
    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: "EDITOR",
      },
    });
    enrolled += 1;
  }
}

console.log(`enrolled ${enrolled} users; total users ${users.length}`);
await prisma.$disconnect();
