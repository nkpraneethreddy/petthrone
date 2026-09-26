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
  const [copied, setCopied] = useState(false);
  const url = shareUrl(pet.id);
  const text = shareText(pet);
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const links = [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
  ];

  async function copy() {
    await navigator.clipboard.writeText(`${text} ${url}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${pet.name} on PetThrone`, text, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    await copy();
  }

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "flex flex-wrap gap-2"}>
      {links.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-line bg-paper px-3 py-2 text-xs font-bold text-ink hover:border-teal"
        >
          {item.label}
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        className="rounded-xl border border-line bg-paper px-3 py-2 text-xs font-bold text-ink hover:border-teal"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <button
        type="button"
        onClick={nativeShare}
        className="rounded-xl bg-emerald px-3 py-2 text-xs font-bold text-white hover:bg-[#0c7c5c]"
      >
        Share card
      </button>
    </div>
  );
}
