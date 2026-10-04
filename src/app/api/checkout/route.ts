import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/rateLimit";
import { attachSession, getSessionUser, loginWithEmail } from "@/lib/session";
import { getPet, getUserPet, savePet } from "@/lib/store";
import { getStripe, hasStripe } from "@/lib/stripe";
import { saveUpload } from "@/lib/upload";
import { MAX_BID_CENTS, MIN_BID_CENTS } from "@/lib/money";
import { acceptedLegal, validateListing } from "@/lib/policy";
import { isEmail, publicOrigin } from "@/lib/site";

export async function POST(req: Request) {
  const limit = rateLimit(req, "checkout", 12, 60_000);
  if (!limit.ok) return tooMany(limit.retryAfter);

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

  const ownerPhotoFile = form.get("ownerPhoto");

  // Deferred so a boost (which carries no listing) never writes files to disk,
  // and so invalid submissions are rejected before anything is stored.
  let uploadedUrls: string[] = [];
  let ownerPhotoUrl: string | null | undefined;
  async function storePhotos() {
    uploadedUrls = [];
    for (const f of rawFiles) {
      uploadedUrls.push(await saveUpload(f));
    }
    if (ownerPhotoFile instanceof File && ownerPhotoFile.size > 0) {
      ownerPhotoUrl = await saveUpload(ownerPhotoFile);
    }
  }

  const sessionUser = await getSessionUser();
  let user = sessionUser;
  if (!user) {
    if (!isEmail(email)) {
      return NextResponse.json({ error: "Email is required to pay." }, { status: 400 });
    }
    user = await loginWithEmail(email);
  }

  if (mode === "boost") {
    const amountCents = Math.round(amountDollars) * 100;
    if (!Number.isFinite(amountCents) || amountCents < MIN_BID_CENTS || amountCents > MAX_BID_CENTS) {
      return NextResponse.json(
        { error: `Pay between $${MIN_BID_CENTS / 100} and $${MAX_BID_CENTS / 100}.` },
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
    const origin = publicOrigin(req);
    try {
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
    } catch {
      return NextResponse.json({ error: "Could not start payment. Try again." }, { status: 502 });
    }
  }

  const amountCents = Math.round(amountDollars) * 100;
  if (!Number.isFinite(amountCents) || amountCents < MIN_BID_CENTS || amountCents > MAX_BID_CENTS) {
    return NextResponse.json(
      { error: `Pay between $${MIN_BID_CENTS / 100} and $${MAX_BID_CENTS / 100}.` },
      { status: 400 },
    );
  }

  if (!hasStripe()) {
    return NextResponse.json(
      { error: "Payments are not configured. Set STRIPE_SECRET_KEY." },
      { status: 503 },
    );
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
    if (rawFiles.length < 2) {
      return NextResponse.json({ error: "Add at least 2 photos of your pet." }, { status: 400 });
    }
    try {
      await storePhotos();
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Upload failed." },
        { status: 400 },
      );
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
    try {
      await storePhotos();
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Upload failed." },
        { status: 400 },
      );
    }
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

  const stripe = getStripe()!;
  const origin = publicOrigin(req);
  try {
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
  } catch {
    return NextResponse.json({ error: "Could not start payment. Try again." }, { status: 502 });
  }
}
