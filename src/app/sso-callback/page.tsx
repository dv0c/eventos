import { redirect } from "next/navigation";

import { routing } from "@/i18n/routing";

/**
 * Bridge for Meindesk SDK bounce URLs that hardcode `/sso-callback`.
 * Forwards all query params to the locale SSO page.
 */
export default async function RootSsoCallbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      qs.set(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        qs.append(key, item);
      }
    }
  }

  const query = qs.toString();
  redirect(
    `/${routing.defaultLocale}/sso-callback${query ? `?${query}` : ""}`,
  );
}
