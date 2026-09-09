/** Fallback app origin from env (also used for emails / absolute links). */
export function getMeindeskAppOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

/**
 * Prefer the live request host so Meindesk Origin checks match the browser
 * (e.g. localhost vs LAN IP), not a mismatched NEXT_PUBLIC_APP_URL.
 */
export function resolveMeindeskOrigin(input?: {
  originHeader?: string | null;
  host?: string | null;
  proto?: string | null;
  fallbackOrigin?: string | null;
}): string {
  const fromHeader = input?.originHeader?.trim().replace(/\/$/, "");
  if (fromHeader) {
    return fromHeader;
  }

  const host = input?.host?.trim().split(",")[0]?.trim();
  if (host) {
    const proto = (input?.proto?.trim() || "http").replace(/:$/, "");
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  const fallback = input?.fallbackOrigin?.trim().replace(/\/$/, "");
  if (fallback) {
    return fallback;
  }

  return getMeindeskAppOrigin();
}
