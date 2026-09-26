import { NextResponse } from "next/server";
import { applyBid } from "@/lib/store";
import { getStripe, hasStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  if (!hasStripe()) {
    return NextResponse.json({ received: true });
  }
  const stripe = getStripe()!;
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing webhook signature." }, { status: 400 });
  }
  const body = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const amountCents = Number(session.metadata?.amountCents ?? session.amount_total ?? 0);
    if (userId && amountCents) {
      await applyBid({
        userId,
        amountCents,
        stripeSessionId: session.id,
        petId: session.metadata?.petId || undefined,
        kind: session.metadata?.kind === "boost" ? "boost" : "bid",
      });
    }
  }
  return NextResponse.json({ received: true });
}
