export const REACTOR_STORAGE_KEY = "eventos_album_reactor";

/**
 * Stable anonymous reactor id for album reactions.
 * SSR-safe: returns "" on the server; client creates/persists a UUID.
 */
export function getOrCreateAlbumReactorKey(): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = localStorage.getItem(REACTOR_STORAGE_KEY)?.trim();
    if (existing && existing.length >= 8) return existing;

    const next =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

    localStorage.setItem(REACTOR_STORAGE_KEY, next);
    return next;
  } catch {
    return "";
  }
}
