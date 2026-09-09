import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@meindesk/sdk";

import { getRateLimitKey, rateLimit } from "@/lib/rate-limit-edge";
import { routing } from "@/i18n/routing";
import { resolveMeindeskOrigin } from "@/server/auth/meindesk-origin";
import { decodeSessionCookieValue } from "@/server/auth/session-cookie";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PREFIXES = [
  "/org",
  "/mod",
  "/admin",
  "/setup",
  "/organizations",
  "/invite",
  "/dashboard",
  "/events",
  "/clients",
  "/templates",
  "/team",
  "/settings",
  "/billing",
  "/invitations",
  "/analytics",
] as const;

const PUBLIC_AUTH_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/sso-callback",
] as const;

const AUTH_RATE_LIMIT_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
] as const;

const PUBLIC_RATE_LIMIT_PATHS = ["/api/public/rsvp", "/api/upload"] as const;

function stripLocale(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);

  if (
    segments[0] &&
    routing.locales.includes(segments[0] as (typeof routing.locales)[number])
  ) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }

  return pathname;
}

function getLocaleFromPath(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean)[0];

  if (
    segment &&
    routing.locales.includes(segment as (typeof routing.locales)[number])
  ) {
    return segment;
  }

  return routing.defaultLocale;
}

function isProtectedPath(pathname: string): boolean {
  const path = stripLocale(pathname);

  return PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function isPublicAuthPath(pathname: string): boolean {
  const path = stripLocale(pathname);
  return PUBLIC_AUTH_PATHS.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  const path = stripLocale(pathname);
  return prefixes.some(
    (prefix) =>
      path === prefix || path.startsWith(`${prefix}/`) || pathname.startsWith(prefix),
  );
}

function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

async function applyRateLimit(
  request: Request,
  prefix: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const identifier = getClientIdentifier(request);
  const result = await rateLimit(getRateLimitKey(prefix, identifier), limit, windowMs);

  if (!result.success) {
    return NextResponse.json(
      { error: { message: "Too many requests", code: "RATE_LIMITED" } },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": String(result.remaining),
        },
      },
    );
  }

  return null;
}

async function validateSessionToken(
  token: string,
  requestOrigin: string,
): Promise<"valid" | "invalid" | "unavailable"> {
  const secretKey = process.env.MEINDESK_SECRET_KEY;
  if (!secretKey) {
    return "valid";
  }

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(
    /\/$/,
    "",
  );
  const publishableKey = process.env.NEXT_PUBLIC_MEINDESK_PUBLISHABLE_KEY;

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      Origin: requestOrigin,
      "x-meindesk-secret-key": secretKey,
    };
    if (publishableKey) {
      headers["x-meindesk-publishable-key"] = publishableKey;
    }

    const response = await fetch(`${apiUrl}/v1/sdk/session`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    // Origin / network / API misconfig — do not wipe the cookie.
    if (!response.ok) {
      return "unavailable";
    }

    const body = (await response.json()) as {
      success?: boolean;
      data?: { session?: unknown | null };
    };

    if (!body.success) {
      return "unavailable";
    }

    return body.data?.session ? "valid" : "invalid";
  } catch {
    return "unavailable";
  }
}

export default async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // OAuth return: one-time code must reach the client before a session cookie exists.
  const oauthCode = searchParams.get("code");
  const oauthProvider = searchParams.get("provider");
  if (oauthCode && oauthProvider) {
    return intlMiddleware(req);
  }

  if (matchesPrefix(pathname, AUTH_RATE_LIMIT_PATHS)) {
    const limited = await applyRateLimit(req, "auth", 20, 60_000);
    if (limited) return limited;
  }

  if (matchesPrefix(pathname, PUBLIC_RATE_LIMIT_PATHS)) {
    const limited = await applyRateLimit(req, "public", 60, 60_000);
    if (limited) return limited;
  }

  if (isPublicAuthPath(pathname)) {
    return intlMiddleware(req);
  }

  if (isProtectedPath(pathname)) {
    const rawToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const token = rawToken ? decodeSessionCookieValue(rawToken) : undefined;

    if (!token) {
      const locale = getLocaleFromPath(pathname);
      const loginUrl = new URL(`/${locale}/login`, req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", stripLocale(pathname));
      return NextResponse.redirect(loginUrl);
    }

    const requestOrigin = resolveMeindeskOrigin({
      originHeader: req.headers.get("origin"),
      host: req.headers.get("x-forwarded-host") ?? req.headers.get("host"),
      proto: req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", ""),
      fallbackOrigin: req.nextUrl.origin,
    });

    const validity = await validateSessionToken(token, requestOrigin);
    if (validity === "invalid") {
      const locale = getLocaleFromPath(pathname);
      const loginUrl = new URL(`/${locale}/login`, req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", stripLocale(pathname));
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
    // "unavailable" (origin/network/API errors): keep cookie and continue
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
