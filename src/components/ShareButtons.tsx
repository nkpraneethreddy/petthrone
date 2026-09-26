"use client";

import { useState } from "react";
import { dollars } from "@/lib/money";
import type { RankedPet } from "@/lib/types";

export function shareText(pet: RankedPet) {
  const rank = pet.rank ? `#${pet.rank}` : "unranked";
  return `${pet.name} is ${rank} on PetThrone at ${dollars(pet.totalCents)}. The richest pet on the web.`;
}

export function shareUrl(petId: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/pets/${petId}`;
}

export function ShareButtons({ pet, compact = false }: { pet: RankedPet; compact?: boolean }) {
  const [sharing, setSharing] = useState(false);

  async function nativeShare() {
    const cardUrl = `/api/og/${pet.id}`;
    const pageUrl = shareUrl(pet.id);
    const text = shareText(pet);

    setSharing(true);
    try {
      if (navigator.share) {
        const response = await fetch(cardUrl);
        const blob = await response.blob();
        const file = new File([blob], `${pet.id}-petthrone-card.png`, { type: "image/png" });

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: `${pet.name} on PetThrone`,
            text,
            files: [file],
          });
        } else {
          await navigator.share({ title: `${pet.name} on PetThrone`, text, url: pageUrl });
        }
      } else {
        window.open(cardUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      window.open(cardUrl, "_blank", "noopener,noreferrer");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className={compact ? "inline-flex" : "flex"}>
      <button
        type="button"
        onClick={nativeShare}
        disabled={sharing}
        className="rounded-xl bg-emerald px-3 py-2 text-xs font-bold text-white hover:bg-[#0c7c5c]"
      >
        {sharing ? "Preparing card…" : "Share card"}
      </button>
    </div>
  );
}
