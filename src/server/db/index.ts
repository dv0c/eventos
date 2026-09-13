import { createRequire } from "node:module";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const REQUIRED_DELEGATES = ["mediaReaction", "songRequest", "eventGame"] as const;

function hasDelegate(
  client: PrismaClient,
  key: (typeof REQUIRED_DELEGATES)[number],
): boolean {
  try {
    const delegate = (client as unknown as Record<string, { findMany?: unknown }>)[
      key
    ];
    return typeof delegate?.findMany === "function";
  } catch {
    return false;
  }
}

function assertRequiredDelegates(client: PrismaClient): void {
  const missing = REQUIRED_DELEGATES.filter((key) => !hasDelegate(client, key));
  if (missing.length === 0) return;

  throw new Error(
    `Prisma Client is missing: ${missing.join(", ")}. ` +
      `Restart the Next.js dev server after running \`prisma generate\`.`,
  );
}

/**
 * Best-effort: drop cached CJS copies of @prisma/client so a long-lived
 * `next dev` process can pick up models added by a later `prisma generate`.
 * Turbopack/ESM may ignore this; the assertion below still forces a clear restart.
 */
function bustPrismaRequireCache(): void {
  if (process.env.NODE_ENV === "production") return;

  try {
    const require = createRequire(path.join(process.cwd(), "package.json"));
    for (const id of Object.keys(require.cache ?? {})) {
      if (id.includes("@prisma/client") || id.includes(".prisma/client")) {
        delete require.cache[id];
      }
    }
  } catch {
    // ESM / Turbopack / no cache — ignore
  }
}

function createPrismaClient(): PrismaClient {
  bustPrismaRequireCache();

  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

  assertRequiredDelegates(client);
  return client;
}

// Drop any client captured before this module revision (HMR / stale generate).
if (process.env.NODE_ENV !== "production" && globalForPrisma.prisma) {
  const stale = globalForPrisma.prisma;
  globalForPrisma.prisma = undefined;
  void stale.$disconnect().catch(() => undefined);
}

function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma;

  // HMR can keep a PrismaClient created before new models were generated.
  // Recreate when a required delegate is missing so routes don't crash.
  if (
    existing &&
    REQUIRED_DELEGATES.some((key) => !hasDelegate(existing, key))
  ) {
    void existing.$disconnect().catch(() => undefined);
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

/**
 * Always resolve through getPrismaClient() so HMR / stale module bindings
 * cannot keep serving a PrismaClient that predates newly generated models.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, _receiver) {
    const client = getPrismaClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});

export default prisma;
