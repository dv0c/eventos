import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

import { getRateLimitKey, rateLimit } from "@/lib/rate-limit-edge";
import { routing } from "@/i18n/routing";
import { auth } from "@/server/auth";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/events",
  "/admin",
  "/clients",
  "/templates",
  "/team",
  "/settings",
  "/billing",
  "/invitations",
  "/analytics",
] as const;

const AUTH_RATE_LIMIT_PATHS = ["/login", "/register", "/api/auth"] as const;

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

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  const path = stripLocale(pathname);
  return prefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`) || pathname.startsWith(prefix),
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

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (matchesPrefix(pathname, AUTH_RATE_LIMIT_PATHS)) {
    const limited = await applyRateLimit(req, "auth", 20, 60_000);
    if (limited) return limited;
  }

  if (matchesPrefix(pathname, PUBLIC_RATE_LIMIT_PATHS)) {
    const limited = await applyRateLimit(req, "public", 60, 60_000);
    if (limited) return limited;
  }

  if (isProtectedPath(pathname) && !isLoggedIn) {
    const locale = getLocaleFromPath(pathname);
    const loginUrl = new URL(`/${locale}/login`, req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
