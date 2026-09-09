/**
 * Meindesk sets `md_session` with encodeURIComponent. Decode once for API Bearer use.
 * Already-plain tokens are returned unchanged.
 */
export function decodeSessionCookieValue(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
