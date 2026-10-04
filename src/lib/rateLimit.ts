type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function clientKey(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Fixed-window limiter held in process memory. Enough to stop a single client
 * from hammering the write endpoints; a multi-instance deploy needs shared state.
 */
export function rateLimit(
  req: Request,
  name: string,
  limit: number,
  windowMs: number,
) {
  const now = Date.now();
  sweep(now);

  const key = `${name}:${clientKey(req)}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true as const };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false as const,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { ok: true as const };
}

export function tooMany(retryAfter: number) {
  return Response.json(
    { error: "Too many requests. Please slow down." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
