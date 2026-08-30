import IORedis from "ioredis";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

let redisClient: IORedis | null = null;
let redisUnavailable = false;

function getRedis(): IORedis | null {
  if (redisUnavailable) return null;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (!redisClient) {
    try {
      redisClient = new IORedis(url, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableOfflineQueue: false,
      });

      redisClient.on("error", () => {
        redisUnavailable = true;
      });
    } catch {
      redisUnavailable = true;
      return null;
    }
  }

  return redisClient;
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redis = getRedis();
  const now = Date.now();

  if (redis) {
    try {
      if (redis.status !== "ready") {
        await redis.connect().catch(() => {
          redisUnavailable = true;
        });
      }

      if (!redisUnavailable && redis.status === "ready") {
        const windowKey = `rl:${key}:${Math.floor(now / windowMs)}`;
        const count = await redis.incr(windowKey);

        if (count === 1) {
          await redis.pexpire(windowKey, windowMs);
        }

        return {
          success: count <= limit,
          remaining: Math.max(0, limit - count),
          resetAt: Math.ceil(now / windowMs) * windowMs,
        };
      }
    } catch {
      redisUnavailable = true;
    }
  }

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
