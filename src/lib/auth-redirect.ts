/**
 * Build a locale-prefixed in-app path for post-auth hard navigation.
 * Accepts relative paths (`/dashboard`) or already-prefixed paths (`/el/dashboard`).
 */
export function localeAwarePath(locale: string, href: string): string {
  if (!href.startsWith("/")) {
    return `/${locale}/dashboard`;
  }

  if (href.startsWith(`/${locale}/`) || href === `/${locale}`) {
    return href;
  }

  return `/${locale}${href === "/" ? "" : href}`;
}

/** Full page navigation so the server receives the Meindesk session cookie. */
export function hardNavigate(locale: string, href: string): void {
  window.location.assign(localeAwarePath(locale, href));
}

/**
 * Same-origin path for post-auth redirect_url query (no origin).
 * Absolute same-origin URLs are reduced to path+search+hash.
 */
export function postAuthDestinationPath(href: string): string {
  if (typeof window !== "undefined") {
    try {
      if (href.startsWith("http://") || href.startsWith("https://")) {
        const url = new URL(href);
        if (url.origin === window.location.origin) {
          return `${url.pathname}${url.search}${url.hash}` || "/";
        }
        return "/dashboard";
      }
    } catch {
      return "/dashboard";
    }
  }

  if (href.startsWith("/") && !href.startsWith("//")) {
    return href;
  }

  return "/dashboard";
}
