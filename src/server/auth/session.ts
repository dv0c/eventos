import { PlatformRole } from "@prisma/client";
import { cookies } from "next/headers";
import type { Session } from "next-auth";

import { auth } from "@/server/auth";

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

export async function getSession(): Promise<Session | null> {
  return auth();
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new AuthError("Authentication required");
  }

  return session;
}

export async function requireAdmin(): Promise<Session> {
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
