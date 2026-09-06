function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function normalizeStorageKey(key: string): string {
  return key.replace(/^\//, "");
}

const IMAGE_KEY_RE = /\.(jpe?g|png|webp|gif|heic|heif|avif|bmp|tiff?)$/i;

export function isImageStorageKey(storageKey: string): boolean {
  return IMAGE_KEY_RE.test(normalizeStorageKey(storageKey));
}

export function openinaryDeliveryUrl(publicUrl: string, storageKey: string): string {
  const key = normalizeStorageKey(storageKey);
  return `${normalizeBaseUrl(publicUrl)}/t/${key}`;
}

export function openinaryTransformUrl(
  publicUrl: string,
  storageKey: string,
  transformation: string,
): string {
  const key = normalizeStorageKey(storageKey);
  const segment = transformation.replace(/^\/+|\/+$/g, "");
  return `${normalizeBaseUrl(publicUrl)}/t/${segment}/${key}`;
}

/** Public display URL; images get EXIF auto-orient (`a_auto`). */
export function openinaryDisplayUrl(publicUrl: string, storageKey: string): string {
  if (isImageStorageKey(storageKey)) {
    return openinaryTransformUrl(publicUrl, storageKey, "a_auto");
  }
  return openinaryDeliveryUrl(publicUrl, storageKey);
}
