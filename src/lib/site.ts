const FALLBACK = "http://localhost:3000";

/** Canonical public origin, without a trailing slash. */
export function siteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : FALLBACK);
  return raw.replace(/\/+$/, "");
}

/**
 * Public origin for redirects and generated assets.
 * Prefer the configured site URL so a forged Host header cannot
 * send Stripe or share cards to another domain.
 */
export function publicOrigin(req: Request) {
  if (process.env.NEXT_PUBLIC_SITE_URL || process.env.NODE_ENV === "production") {
    return siteUrl();
  }
  return new URL(req.url).origin;
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
