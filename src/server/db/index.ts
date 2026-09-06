import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

const REQUIRED_DELEGATES = ["mediaReaction", "songRequest"] as const;

function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma;

  // HMR can keep a PrismaClient created before new models were generated.
  // Recreate when a required delegate is missing so routes don't crash.
  if (
    existing &&
    REQUIRED_DELEGATES.some(
      (key) => typeof existing[key]?.findMany !== "function",
    )
  ) {
    void existing.$disconnect();
    globalForPrisma.prisma = undefined;
  }

  const client = globalForPrisma.prisma ?? createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = getPrismaClient();

export default prisma;
