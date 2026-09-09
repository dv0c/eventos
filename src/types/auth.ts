import type { Locale, PlatformRole } from "@prisma/client";

export interface EventosSessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  locale: Locale;
  platformRole: PlatformRole;
}

export interface EventosSession {
  user: EventosSessionUser;
}
