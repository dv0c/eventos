export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count += 1;
  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

export function getRateLimitKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}
