import type { Locale, PlatformRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      locale: Locale;
      platformRole: PlatformRole;
    } & DefaultSession["user"];
  }

  interface User {
    locale: Locale;
    platformRole: PlatformRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    locale?: Locale;
    platformRole?: PlatformRole;
  }
}
