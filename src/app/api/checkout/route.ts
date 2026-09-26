import { NextResponse } from "next/server";
import { attachSession, getSessionUser, loginWithEmail } from "@/lib/session";
import { getPet, getUserPet, savePet } from "@/lib/store";
import { getStripe, hasStripe } from "@/lib/stripe";
import { saveUpload } from "@/lib/upload";
import { MIN_BID_CENTS } from "@/lib/money";
import { acceptedLegal, validateListing } from "@/lib/policy";

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("name") ?? "").trim();
  const boast = String(form.get("boast") ?? "").trim();
  const ownerName = String(form.get("ownerName") ?? "").trim();
  const country = String(form.get("country") ?? "").trim();
  const amountDollars = Number(form.get("amount"));
  const mode = String(form.get("mode") ?? "bid").trim();
  const targetPetId = String(form.get("petId") ?? "").trim();

  if (!acceptedLegal(form)) {
    return NextResponse.json(
      { error: "Accept the Rules, Terms, and Privacy Policy to bid." },
      { status: 400 },
    );
  }

  const rawFiles = [
    ...form.getAll("photos"),
    ...form.getAll("photo"),
  ].filter((f): f is File => f instanceof File && f.size > 0).slice(0, 3);

  const uploadedUrls: string[] = [];
  for (const f of rawFiles) {
    uploadedUrls.push(await saveUpload(f));
  }

  const ownerPhotoFile = form.get("ownerPhoto");
  let ownerPhotoUrl: string | null | undefined;
  if (ownerPhotoFile instanceof File && ownerPhotoFile.size > 0) {
    ownerPhotoUrl = await saveUpload(ownerPhotoFile);
  }

  const sessionUser = await getSessionUser();
  let user = sessionUser;
  if (!user) {
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Email is required to pay." }, { status: 400 });
    }
    user = await loginWithEmail(email);
  }

  if (mode === "boost") {
    const amountCents = Math.round(amountDollars) * 100;
    if (!Number.isFinite(amountCents) || amountCents < MIN_BID_CENTS) {
      return NextResponse.json(
        { error: `Pay at least $${MIN_BID_CENTS / 100}.` },
        { status: 400 },
      );
    }
    const target = await getPet(targetPetId);
    if (!target) {
      return NextResponse.json({ error: "That pet is gone." }, { status: 404 });
    }
    if (!hasStripe()) {
      return NextResponse.json(
        { error: "Payments are not configured. Set STRIPE_SECRET_KEY." },
        { status: 503 },
      );
    }
    const stripe = getStripe()!;
    const origin = new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${origin}/pets/${target.id}?boosted=1`,
      cancel_url: `${origin}/pets/${target.id}?canceled=1`,
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `Boost ${target.name} on PetThrone`,
              description: "Adds to this pet’s public total. Not refundable. Does not transfer the listing.",
            },
          },
        },
      ],
      metadata: {
        userId: user.id,
        petId: target.id,
        amountCents: String(amountCents),
        kind: "boost",
      },
    });
    const res = NextResponse.json({ url: session.url });
    attachSession(res, user.id);
    return res;
  }

  let petName = "";
  const existing = await getUserPet(user.id);
  if (!existing) {
    const listingError = validateListing({
      name,
      ownerName,
      country,
      boast,
      requireOwner: true,
    });
    if (listingError) {
      return NextResponse.json({ error: listingError }, { status: 400 });
    }
    if (uploadedUrls.length < 2) {
      return NextResponse.json({ error: "Add at least 2 photos of your pet." }, { status: 400 });
    }
    const photos = uploadedUrls;
    const created = await savePet({
      userId: user.id,
      name,
      boast,
      photos,
      photoUrl: photos[0],
      ownerName,
      country,
      ownerPhotoUrl: ownerPhotoUrl ?? null,
    });
    petName = created.name;
  } else {
    const photos = uploadedUrls.length > 0 ? uploadedUrls : existing.photos || [existing.photoUrl];
    const saved = await savePet({
      userId: user.id,
      name: name || existing.name,
      boast: boast || existing.boast,
      photos,
      photoUrl: photos[0],
      ownerName: ownerName || existing.ownerName,
      country: country || existing.country,
      ownerPhotoUrl,
    });
    petName = saved.name;
  }

  const amountCents = Math.round(amountDollars) * 100;
  if (!Number.isFinite(amountCents) || amountCents < MIN_BID_CENTS) {
    return NextResponse.json(
      { error: `Pay at least $${MIN_BID_CENTS / 100}.` },
      { status: 400 },
    );
  }

  if (!hasStripe()) {
    return NextResponse.json(
      { error: "Payments are not configured. Set STRIPE_SECRET_KEY." },
      { status: 503 },
    );
  }

  const stripe = getStripe()!;
  const origin = new URL(req.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/?paid=1`,
    cancel_url: `${origin}/?canceled=1`,
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `PetThrone rank for ${petName}`,
            description: "Public board placement. Not refundable.",
          },
        },
      },
    ],
    metadata: {
      userId: user.id,
      amountCents: String(amountCents),
      kind: "bid",
    },
  });
  const res = NextResponse.json({ url: session.url });
  attachSession(res, user.id);
  return res;
}
