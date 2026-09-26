"use client";

import { useState } from "react";
import type { RankedPet } from "@/lib/types";

export function shareText(pet: RankedPet) {
  const rank = pet.rank ? `#${pet.rank}` : "unranked";
  return `${pet.name} is ranked ${rank} on PetThrone.`;
}

export function shareUrl(petId: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/pets/${petId}`;
}

export function ShareButtons({ pet, compact = false }: { pet: RankedPet; compact?: boolean }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cardUrl = `/api/og/${pet.id}`;

  async function showPreview() {
    setPreparing(true);
    setError(null);
    try {
      const response = await fetch(cardUrl);
      if (!response.ok) throw new Error("Could not generate the card.");
      const blob = await response.blob();
      setCardFile(new File([blob], `${pet.id}-petthrone-card.png`, { type: "image/png" }));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewOpen(true);
    } catch {
      setError("Could not generate the card. Please try again.");
    } finally {
      setPreparing(false);
    }
  }

  function closePreview() {
    setPreviewOpen(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCardFile(null);
    setError(null);
  }

  async function chooseApp() {
    if (!navigator.share) {
      setError("Your browser does not support the device sharing menu.");
      return;
    }

    setSharing(true);
    setError(null);
    try {
      const data: ShareData =
        cardFile && navigator.canShare?.({ files: [cardFile] })
          ? { title: `${pet.name} on PetThrone`, text: shareText(pet), files: [cardFile] }
          : {
              title: `${pet.name} on PetThrone`,
              text: shareText(pet),
              url: shareUrl(pet.id),
            };
      await navigator.share(data);
    } catch (shareError) {
      if (!(shareError instanceof DOMException && shareError.name === "AbortError")) {
        setError("The sharing menu could not be opened.");
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className={compact ? "inline-flex" : "flex"}>
      <button
        type="button"
        onClick={showPreview}
        disabled={preparing}
        className="rounded-xl bg-emerald px-3 py-2 text-xs font-bold text-white hover:bg-[#0c7c5c]"
      >
        {preparing ? "Preparing card…" : "Share card"}
      </button>
      {!previewOpen && error && <span className="ml-2 text-xs text-vermillion">{error}</span>}

      {previewOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close share card"
            onClick={closePreview}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`share-title-${pet.id}`}
            className="relative z-10 w-full max-w-md rounded-2xl bg-paper p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 id={`share-title-${pet.id}`} className="font-bold text-ink">
                  Share this card
                </h2>
                <p className="text-xs text-mute">Choose an app from your device.</p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-lg px-2 py-1 text-mute hover:bg-canvas hover:text-ink"
              >
                Close
              </button>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl || cardUrl}
              alt={`${pet.name} share card`}
              className="mt-4 aspect-square w-full rounded-xl object-cover"
            />

            {error && <p className="mt-3 text-sm text-vermillion">{error}</p>}

            <button
              type="button"
              onClick={chooseApp}
              disabled={sharing}
              className="mt-4 w-full rounded-xl bg-emerald px-4 py-3 text-sm font-bold text-white hover:bg-[#0c7c5c] disabled:opacity-60"
            >
              {sharing ? "Opening sharing menu…" : "Choose app"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
