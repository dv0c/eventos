import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.eventSettings.updateMany({
    where: {
      OR: [{ isPublic: false }, { enableGallery: false }, { enableWall: false }],
    },
    data: {
      isPublic: true,
      enableGallery: true,
      enableWall: true,
    },
  });

  console.log(`Updated ${result.count} event settings`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
