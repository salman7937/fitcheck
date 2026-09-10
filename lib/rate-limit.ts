import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
let uidLimiters: { anonymous: Ratelimit; google: Ratelimit } | null = null;
let ipLimiter: Ratelimit | null = null;

function isConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRedis(): Redis {
  if (!redis) redis = Redis.fromEnv();
  return redis;
}

/** §6.6: rate limiting keys on uid, not IP — 2/day anonymous, 10/day Google. */
function getUidLimiters() {
  if (!uidLimiters) {
    const client = getRedis();
    uidLimiters = {
      anonymous: new Ratelimit({
        redis: client,
        limiter: Ratelimit.slidingWindow(2, "24 h"),
        prefix: "ratelimit:analyze:anon",
      }),
      google: new Ratelimit({
        redis: client,
        limiter: Ratelimit.slidingWindow(10, "24 h"),
        prefix: "ratelimit:analyze:google",
      }),
    };
  }
  return uidLimiters;
}

/** Abuse floor alongside the uid limit — anonymous accounts are free to mint (§6.6). */
function getIpLimiter(): Ratelimit {
  if (!ipLimiter) {
    ipLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(20, "24 h"),
      prefix: "ratelimit:analyze:ip",
    });
  }
  return ipLimiter;
}

export type RateLimitResult = { success: boolean; remaining: number; limit: number };

/**
 * Checks both the uid-keyed quota (per §6.6's table) and the IP floor.
 * No-ops (always succeeds) when Upstash isn't configured, so local dev
 * without a Redis project doesn't block the rest of the app.
 */
export async function checkAnalyzeRateLimit(
  uid: string,
  isAnonymous: boolean,
  ip: string
): Promise<RateLimitResult> {
  if (!isConfigured()) {
    return { success: true, remaining: Infinity, limit: Infinity };
  }

  const { anonymous, google } = getUidLimiters();
  const uidLimiter = isAnonymous ? anonymous : google;

  const [uidResult, ipResult] = await Promise.all([
    uidLimiter.limit(uid),
    getIpLimiter().limit(ip),
  ]);

  if (!ipResult.success) {
    return { success: false, remaining: 0, limit: ipResult.limit };
  }

  return { success: uidResult.success, remaining: uidResult.remaining, limit: uidResult.limit };
}
