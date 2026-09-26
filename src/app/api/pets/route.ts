import { NextResponse } from "next/server";
import { attachSession, getSessionUser, loginWithEmail } from "@/lib/session";
import { getUserPet, savePet } from "@/lib/store";
import { saveUpload } from "@/lib/upload";
import { acceptedLegal, validateListing } from "@/lib/policy";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ pet: null });
  const pet = await getUserPet(user.id);
  return NextResponse.json({ pet });
}

export async function POST(req: Request) {
  let user = await getSessionUser();
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();

  let newlyLoggedIn = false;
  if (!user) {
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid owner email address." },
        { status: 400 }
      );
    }
    user = await loginWithEmail(email);
    newlyLoggedIn = true;
  }

  const name = String(form.get("name") ?? "").trim();
  const boast = String(form.get("boast") ?? "").trim();
  const ownerName = String(form.get("ownerName") ?? "").trim();
  const country = String(form.get("country") ?? "").trim();

  const rawFiles = [
    ...form.getAll("photos"),
    ...form.getAll("photo"),
  ].filter((f): f is File => f instanceof File && f.size > 0).slice(0, 3);

  const uploadedUrls: string[] = [];
  for (const f of rawFiles) {
    uploadedUrls.push(await saveUpload(f));
  }

  if (!acceptedLegal(form)) {
    return NextResponse.json(
      { error: "Accept the Rules, Terms, and Privacy Policy." },
      { status: 400 },
    );
  }

  if (!name) return NextResponse.json({ error: "Pet name is required." }, { status: 400 });
  const existing = await getUserPet(user.id);
  const listingError = validateListing({
    name,
    ownerName,
    country,
    boast,
    requireOwner: !existing,
  });
  if (listingError) {
    return NextResponse.json({ error: listingError }, { status: 400 });
  }

  const ownerPhotoFile = form.get("ownerPhoto");
  let ownerPhotoUrl: string | null | undefined;
  if (ownerPhotoFile instanceof File && ownerPhotoFile.size > 0) {
    ownerPhotoUrl = await saveUpload(ownerPhotoFile);
  }

  if (!existing && uploadedUrls.length < 2) {
    return NextResponse.json({ error: "Add at least 2 photos of your pet." }, { status: 400 });
  }

  const photos =
    uploadedUrls.length > 0
      ? uploadedUrls
      : existing?.photos || (existing?.photoUrl ? [existing.photoUrl] : []);

  if (photos.length < 2) {
    return NextResponse.json({ error: "Add at least 2 photos of your pet." }, { status: 400 });
  }

  const pet = await savePet({
    userId: user.id,
    name,
    boast,
    photos,
    photoUrl: photos[0],
    ownerName: ownerName || existing?.ownerName,
    country: country || existing?.country,
    ownerPhotoUrl,
  });

  const res = NextResponse.json({ pet, user });
  if (newlyLoggedIn && user) {
    attachSession(res, user.id);
  }
  return res;
}
