/** Shared plan catalog for seed scripts and runtime platform-org ensure. */
export const DEFAULT_PLANS = [
  {
    name: "FREE",
    slug: "free",
    description: "Για μικρά events και δοκιμή της πλατφόρμας",
    priceMonthly: 0,
    priceYearly: 0,
    sortOrder: 0,
    limits: {
      maxEvents: 1,
      maxGuests: 50,
      maxStorage: 500,
      maxCollaborators: 1,
      maxMessages: 100,
      maxWhatsAppMessages: 0,
    },
  },
  {
    name: "STARTER",
    slug: "starter",
    description: "Για freelance planners και μικρές εκδηλώσεις",
    priceMonthly: 2900,
    priceYearly: 29000,
    sortOrder: 1,
    limits: {
      maxEvents: 5,
      maxGuests: 200,
      maxStorage: 5000,
      maxCollaborators: 3,
      maxMessages: 1000,
      maxWhatsAppMessages: 100,
    },
  },
  {
    name: "PRO",
    slug: "pro",
    description: "Για επαγγελματίες event planners",
    priceMonthly: 7900,
    priceYearly: 79000,
    sortOrder: 2,
    limits: {
      maxEvents: 25,
      maxGuests: 1000,
      maxStorage: 25000,
      maxCollaborators: 10,
      maxMessages: 10000,
      maxWhatsAppMessages: 1000,
    },
  },
  {
    name: "BUSINESS",
    slug: "business",
    description: "Για agencies με πολλαπλές ομάδες",
    priceMonthly: 14900,
    priceYearly: 149000,
    sortOrder: 3,
    limits: {
      maxEvents: 100,
      maxGuests: 5000,
      maxStorage: 100000,
      maxCollaborators: 25,
      maxMessages: 50000,
      maxWhatsAppMessages: 5000,
    },
  },
  {
    name: "ENTERPRISE",
    slug: "enterprise",
    description: "Custom λύση για μεγάλους οργανισμούς",
    priceMonthly: 0,
    priceYearly: 0,
    sortOrder: 4,
    limits: {
      maxEvents: -1,
      maxGuests: -1,
      maxStorage: -1,
      maxCollaborators: -1,
      maxMessages: -1,
      maxWhatsAppMessages: -1,
    },
  },
] as const;

export const PLATFORM_ORG_SLUG_DEFAULT = "eventos";
export const PLATFORM_ORG_NAME = "Eventos";
export const PLATFORM_PLAN_SLUG = "enterprise";
export const PLATFORM_ADMIN_EMAIL = "admin@eventos.gr";

export function getPlatformOrgSlug(): string {
  const fromEnv = process.env.PLATFORM_ORG_SLUG?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : PLATFORM_ORG_SLUG_DEFAULT;
}
