import Stripe from "stripe";

let client: Stripe | null = null;

export function hasStripe() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key, {
    apiVersion: "2026-08-26.dahlia",
    typescript: true,
    maxNetworkRetries: 2,
    timeout: 20_000,
    appInfo: { name: "PetThrone", version: "1.0.0" },
  });
  return client;
}
