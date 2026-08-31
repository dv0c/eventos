function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function normalizeStorageKey(key: string): string {
  return key.replace(/^\//, "");
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
