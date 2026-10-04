"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { COUNTRIES } from "@/lib/countries";
import { dollars, MIN_BID_CENTS, projectedRank } from "@/lib/money";
import { MAX_BOAST, MAX_OWNER_NAME, MAX_PET_NAME } from "@/lib/policy";
import type { CourtState, MeState } from "@/lib/types";
import { MultiImageUpload } from "./MultiImageUpload";

export interface ChallengeModalProps {
  court: CourtState;
  me: MeState;
  amount: number;
  targetRank?: number;
  targetPetName?: string;
  isOpen: boolean;
  onClose: () => void;
  onAmount: (n: number) => void;
  onDone: (court: CourtState) => void;
}

export function ChallengeModal({
  court,
  me,
  amount,
  targetRank = 1,
  targetPetName,
  isOpen,
  onClose,
  onAmount,
  onDone,
}: ChallengeModalProps) {
  const [email, setEmail] = useState(me.user?.email ?? "");
  const [name, setName] = useState(me.pet?.name ?? "");
  const [boast, setBoast] = useState(me.pet?.boast ?? "");
  const [ownerName, setOwnerName] = useState(me.pet?.ownerName ?? "");
  const [country, setCountry] = useState(me.pet?.country ?? "");
  const [ownerPhoto, setOwnerPhoto] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const ownerPreview = useMemo(() => {
    if (ownerPhoto) return URL.createObjectURL(ownerPhoto);
    return me.pet?.ownerPhotoUrl ?? null;
  }, [ownerPhoto, me.pet?.ownerPhotoUrl]);

  useEffect(() => {
    return () => {
      if (ownerPreview?.startsWith("blob:")) URL.revokeObjectURL(ownerPreview);
    };
  }, [ownerPreview]);

  useEffect(() => {
    if (me.user?.email && !email) setEmail(me.user.email);
    if (me.pet?.name && !name) setName(me.pet.name);
    if (me.pet?.boast && !boast) setBoast(me.pet.boast);
    if (me.pet?.ownerName && !ownerName) setOwnerName(me.pet.ownerName);
    if (me.pet?.country && !country) setCountry(me.pet.country);
  }, [me, email, name, boast, ownerName, country]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setStep(1);
        setError(null);
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const cents = Math.round(amount) * 100;
  const currentTotal = me.pet && "totalCents" in me.pet ? me.pet.totalCents : 0;
  const nextTotal = currentTotal + cents;

  const allBoard = useMemo(
    () => court.court.concat(court.challengers),
    [court.court, court.challengers],
  );

  const projected = useMemo(
    () => projectedRank(nextTotal, allBoard, me.pet?.id),
    [nextTotal, allBoard, me.pet?.id],
  );

  const throneCost = Math.ceil(court.nextThroneCents / 100);

  function closeModal() {
    setStep(1);
    setError(null);
    onClose();
  }

  function goToImages() {
    setError(null);
    if (!me.user && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (!name.trim()) {
      setError("Pet name is required.");
      return;
    }
    if (!ownerName.trim()) {
      setError("Owner name is required.");
      return;
    }
    if (!country) {
      setError("Country is required.");
      return;
    }
    setStep(2);
  }

  function goToConfirmation() {
    setError(null);
    const existingPhotosCount = me.pet?.photos?.length || (me.pet?.photoUrl ? 1 : 0);
    const totalPhotos = files.length > 0 ? files.length : existingPhotosCount;
    if (!me.pet && totalPhotos < 2) {
      setError("Add at least 2 photos.");
      return;
    }
    setStep(3);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const existingPhotosCount = me.pet?.photos?.length || (me.pet?.photoUrl ? 1 : 0);
    const totalPhotos = files.length > 0 ? files.length : existingPhotosCount;

    if (!me.pet && totalPhotos < 2) {
      setError("Add at least 2 photos.");
      setBusy(false);
      return;
    }
    if (!me.pet && !ownerName.trim()) {
      setError("Owner name is required.");
      setBusy(false);
      return;
    }
    if (!me.pet && !country.trim()) {
      setError("Country is required.");
      setBusy(false);
      return;
    }
    if (!acceptedLegal) {
      setError("Accept the Rules, Terms, and Privacy Policy to bid.");
      setBusy(false);
      return;
    }

    try {
      const form = new FormData();
      form.set("email", email);
      form.set("name", name);
      form.set("boast", boast);
      form.set("ownerName", ownerName);
      form.set("country", country);
      form.set("amount", String(Math.round(amount)));
      form.set("acceptedLegal", "1");
      files.forEach((f) => form.append("photos", f));
      if (ownerPhoto) form.set("ownerPhoto", ownerPhoto);

      const res = await fetch("/api/checkout", { method: "POST", body: form });
      const data = (await res.json()) as {
        error?: string;
        url?: string;
        demo?: boolean;
        court?: CourtState;
      };
      if (!res.ok) throw new Error(data.error || "Payment failed.");
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.court) {
        onDone(data.court);
        setFiles([]);
        closeModal();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!isOpen) return null;

  const hasPet = Boolean(me.pet);
  const isTakingThrone = projected === 1;

  const targetLabel = `#${targetRank}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={closeModal}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div className="relative my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-paper shadow-2xl transition-all max-h-[92vh] overflow-y-auto">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-teal/10 blur-3xl" />

        {/* Modal Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-ink">Bid for {targetLabel}</span>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-paper text-mute transition-all hover:bg-line hover:text-ink"
            title="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 p-6 md:p-8">
          <div className="grid grid-cols-3 gap-2" aria-label={`Step ${step} of 3`}>
            {["Pet & owner", "Images", "Confirm"].map((label, index) => {
              const number = index + 1;
              const active = number === step;
              const complete = number < step;
              return (
                <div key={label} className="text-center">
                  <div
                    className={`h-1.5 rounded-full ${
                      active || complete ? "bg-emerald" : "bg-line"
                    }`}
                  />
                  <span
                    className={`mt-2 block text-[11px] font-bold ${
                      active ? "text-ink" : "text-mute"
                    }`}
                  >
                    {number}. {label}
                  </span>
                </div>
              );
            })}
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {error && (
              <div className="rounded-2xl border border-vermillion/30 bg-vermillion/10 p-3 text-sm font-semibold text-vermillion">
                {error}
              </div>
            )}

            {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              {!me.user && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-ink">
                    Owner Email <span className="text-vermillion">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    placeholder="you@email.com"
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-mute/60 focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/10"
                  />
                </div>
              )}

              <div className={!me.user ? "" : "md:col-span-2"}>
                <label className="text-xs font-bold uppercase tracking-wider text-ink">
                  Pet Name <span className="text-vermillion">*</span>
                </label>
                <input
                  required={!hasPet}
                  maxLength={MAX_PET_NAME}
                  value={name}
                  placeholder="Your pet’s name"
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-mute/60 focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink">
                  Owner name <span className="text-vermillion">*</span>
                </label>
                <input
                  required={!hasPet}
                  maxLength={MAX_OWNER_NAME}
                  value={ownerName}
                  placeholder="Your name"
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-mute/60 focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink">
                  Country <span className="text-vermillion">*</span>
                </label>
                <select
                  required={!hasPet}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition-all focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/10"
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-ink">
                  Boast
                </label>
                <input
                  maxLength={MAX_BOAST}
                  value={boast}
                  placeholder="One line about your pet"
                  onChange={(e) => setBoast(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-mute/60 focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/10"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-ink">
                  Your photo <span className="font-medium normal-case tracking-normal text-mute">optional</span>
                </label>
                <div className="mt-1.5 flex items-center gap-3">
                  <span className="inline-flex h-14 w-14 overflow-hidden rounded-full border border-line bg-paper">
                    {ownerPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ownerPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs text-mute">
                        —
                      </span>
                    )}
                  </span>
                  <label className="cursor-pointer rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold text-ink hover:border-teal">
                    {ownerPreview ? "Change photo" : "Add photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => setOwnerPhoto(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {ownerPhoto && (
                    <button
                      type="button"
                      onClick={() => setOwnerPhoto(null)}
                      className="text-xs font-bold text-mute hover:text-ink"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* Multi-Image Upload (2-3 photos) */}
            {step === 2 && (
            <div className="rounded-2xl border border-line/80 bg-[#fbfdfc] p-4">
              <MultiImageUpload
                files={files}
                onChange={setFiles}
                existingUrls={me.pet?.photos || (me.pet?.photoUrl ? [me.pet.photoUrl] : [])}
                minPhotos={hasPet ? 0 : 2}
                maxPhotos={3}
              />
            </div>
            )}

            {step === 1 && (
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-line px-5 py-3 text-sm font-bold text-ink hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={goToImages}
                  className="rounded-xl bg-emerald px-6 py-3 text-sm font-bold text-white hover:bg-[#0c7c5c]"
                >
                  Continue to images
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep(1);
                  }}
                  className="rounded-xl border border-line px-5 py-3 text-sm font-bold text-ink hover:bg-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={goToConfirmation}
                  className="rounded-xl bg-emerald px-6 py-3 text-sm font-bold text-white hover:bg-[#0c7c5c]"
                >
                  Review bid
                </button>
              </div>
            )}

            {/* Custom Bid Input & Live Projected Outcome */}
            {step === 3 && (
            <>
            <div className="grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-mute">Pet</div>
                <div className="mt-1 font-bold text-ink">{name}</div>
                {boast && <div className="mt-1 line-clamp-2 text-xs text-mute">{boast}</div>}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-mute">Owner</div>
                <div className="mt-1 font-bold text-ink">{ownerName}</div>
                <div className="mt-1 text-xs text-mute">{country}</div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-emerald/25 bg-emerald/5 p-4 sm:flex-row sm:items-center">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald">
                  Target
                </div>
                <div className="mt-0.5 font-[family-name:var(--font-display)] text-lg font-bold text-ink">
                  {targetLabel}
                </div>
                {targetPetName && (
                  <div className="mt-0.5 text-xs text-mute">
                    Held by <strong className="text-ink">{targetPetName}</strong>
                  </div>
                )}
              </div>
              <div className="text-left sm:text-right">
                <div className="text-[10px] font-bold uppercase text-mute">#1 costs</div>
                <div className="font-[family-name:var(--font-display)] text-lg font-bold text-vermillion">
                  {dollars(court.nextThroneCents)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-mute">Quick amount:</span>
              <button
                type="button"
                onClick={() => onAmount(throneCost)}
                className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink hover:border-ink"
              >
                Take #1 for ${throneCost}
              </button>
              <button
                type="button"
                onClick={() => onAmount(Math.max(MIN_BID_CENTS / 100, Math.round(amount + 10)))}
                className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink hover:border-ink"
              >
                Add $10
              </button>
            </div>

            <div className="grid gap-4 rounded-2xl border border-line bg-paper p-4 md:grid-cols-2 md:items-center">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink">
                  Bid
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-mute">
                    $
                  </span>
                  <input
                    required
                    type="number"
                    min={MIN_BID_CENTS / 100}
                    step={1}
                    value={amount}
                    onChange={(e) => onAmount(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-2xl border border-line bg-white py-3 pl-9 pr-4 font-[family-name:var(--font-display)] text-2xl font-bold text-ink outline-none transition-all focus:border-emerald focus:ring-4 focus:ring-emerald/10"
                  />
                </div>
                <p className="mt-1 text-[11px] text-mute">
                  Min ${MIN_BID_CENTS / 100}. Bids stack and are not refunded.
                </p>
              </div>

              {/* Live Outcome Box */}
              <div
                className={`rounded-xl border p-4 transition-all ${
                  isTakingThrone
                    ? "border-emerald/40 bg-emerald/10 text-emerald"
                    : "border-line bg-white text-ink"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    New rank
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                      isTakingThrone ? "bg-emerald text-white" : "bg-paper text-ink"
                    }`}
                  >
                    #{projected}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-[family-name:var(--font-display)] text-xl font-bold">
                    {isTakingThrone ? "Takes #1" : `#${projected}`}
                  </span>
                  <span className="text-xs text-mute font-medium">
                    ({dollars(nextTotal)} total)
                  </span>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-line bg-paper p-3 text-xs leading-5 text-ink">
              <input
                type="checkbox"
                required
                checked={acceptedLegal}
                onChange={(e) => setAcceptedLegal(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-emerald"
              />
              <span>
                I am 18 or older. I accept the{" "}
                <Link href="/rules" target="_blank" className="font-bold text-emerald underline-offset-2 hover:underline">
                  Rules
                </Link>
                ,{" "}
                <Link href="/terms" target="_blank" className="font-bold text-emerald underline-offset-2 hover:underline">
                  Terms
                </Link>
                , and{" "}
                <Link href="/privacy" target="_blank" className="font-bold text-emerald underline-offset-2 hover:underline">
                  Privacy Policy
                </Link>
                . Bids are final and not refunded.
              </span>
            </label>

            {/* Primary Action Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(2);
                }}
                className="rounded-2xl border border-line bg-paper px-5 py-4 text-center font-bold text-ink transition-colors hover:bg-white"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={busy || !acceptedLegal}
                className="group relative flex-1 overflow-hidden rounded-2xl bg-vermillion py-4 text-center font-[family-name:var(--font-display)] text-lg font-bold text-white shadow-lg shadow-vermillion/25 transition-all hover:bg-[#c93222] hover:shadow-xl hover:shadow-vermillion/35 active:scale-[0.99] disabled:opacity-60"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {busy ? (
                    <>Paying…</>
                  ) : (
                    <>Pay {dollars(cents)} for #{projected}</>
                  )}
                </span>
              </button>
            </div>
            </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

// Backwards-compatible export
export { ChallengeModal as BidForm };
