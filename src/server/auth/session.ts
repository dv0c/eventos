import { PlatformRole } from "@prisma/client";
import { SESSION_COOKIE_NAME } from "@meindesk/sdk";
import { cookies, headers } from "next/headers";

import type { EventosSession } from "@/types/auth";

import { createServerMeindeskClient } from "./meindesk-client";
import { resolveMeindeskOrigin } from "./meindesk-origin";
import { decodeSessionCookieValue } from "./session-cookie";
import { syncLocalUserFromMeindesk } from "./sync-user";

export const ACTIVE_ORG_COOKIE = "ACTIVE_ORG_ID";

export class AuthError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode = 401, code = "UNAUTHORIZED") {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function toSession(
  user: Awaited<ReturnType<typeof syncLocalUserFromMeindesk>>,
): EventosSession {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      locale: user.locale,
      platformRole: user.platformRole,
    },
  };
}

async function resolveSessionOrigin(): Promise<string> {
  const h = await headers();
  return resolveMeindeskOrigin({
    originHeader: h.get("origin"),
    host: h.get("x-forwarded-host") ?? h.get("host"),
    proto: h.get("x-forwarded-proto"),
  });
}

export async function getSession(): Promise<EventosSession | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rawToken) {
    return null;
  }

  const token = decodeSessionCookieValue(rawToken);

  try {
    const client = createServerMeindeskClient(await resolveSessionOrigin());
    const result = await client.getSession(token);

    if (!result.session || !result.user) {
      return null;
    }

    const localUser = await syncLocalUserFromMeindesk(result.user);
    return toSession(localUser);
  } catch (error) {
    if (error instanceof Error && error.message === "USER_DELETED") {
      return null;
    }
    console.error("[auth] getSession failed:", error);
    return null;
  }
}

export async function requireAuth(): Promise<EventosSession> {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new AuthError("Authentication required");
  }

  return session;
}

export async function requireAdmin(): Promise<EventosSession> {
  const session = await requireAuth();

  if (session.user.platformRole !== PlatformRole.ADMIN) {
    throw new AuthError("Admin access required", 403, "FORBIDDEN");
  }

  return session;
}

export async function getActiveOrganizationId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;
}

export async function setActiveOrganization(organizationId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}
