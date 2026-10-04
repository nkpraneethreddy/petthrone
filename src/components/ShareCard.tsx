"use client";

import { useEffect, useState } from "react";
import { dollars } from "@/lib/money";
import type { RankedPet } from "@/lib/types";
import { OwnerLine } from "./OwnerLine";
import { ShareButtons } from "./ShareButtons";

export function ShareCard({
  pet,
}: {
  pet: RankedPet;
  nextThrone: number;
  snapshot?: string;
}) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const photos = pet.photos && pet.photos.length > 0 ? pet.photos : [pet.photoUrl || "/seed/bean.svg"];

  useEffect(() => {
    fetch(`/api/pets/${pet.id}/click`, { method: "POST" }).catch(() => undefined);
  }, [pet.id]);

  const isKing = pet.rank === 1;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-paper p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] md:p-8">
      {/* Decorative top ribbon */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 items-center rounded-full bg-emerald/10 px-3 text-xs font-black uppercase tracking-wider text-emerald">
            {isKing ? "👑 King" : "Pet"}
          </span>
          <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-semibold text-mute border border-line">
            {pet.rank ? `#${pet.rank} worldwide` : "Unranked"}
          </span>
        </div>
        <div className="font-[family-name:var(--font-display)] text-2xl font-black text-ink">
          {pet.rank ? `#${pet.rank}` : "UNRANKED"}
        </div>
      </div>

      {/* 2-3 Photo Gallery */}
      <div className="mt-6">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-paper shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[activePhotoIdx] || pet.photoUrl}
            alt={`${pet.name} photo ${activePhotoIdx + 1}`}
            className="h-full w-full object-cover transition-all duration-500"
          />

          {/* Photo Navigation Overlay */}
          {photos.length > 1 && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/50 p-1.5 backdrop-blur-md">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === activePhotoIdx ? "w-6 bg-white" : "w-2 bg-white/50"
                  }`}
                  title={`View photo ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* 2-3 Photo Thumbnails */}
        {photos.length > 1 && (
          <div className="mt-3 flex gap-2">
            {photos.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePhotoIdx(idx)}
                className={`relative h-16 w-20 overflow-hidden rounded-xl border-2 transition-all ${
                  idx === activePhotoIdx
                    ? "border-emerald shadow-md ring-2 ring-emerald/20"
                    : "border-line opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[9px] font-bold text-white">
                  #{idx + 1}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pet Credentials */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-ink md:text-4xl">
            {pet.name}
          </h1>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mute">
              Total
            </span>
            <div className="font-[family-name:var(--font-display)] text-3xl font-black text-emerald md:text-4xl">
              {dollars(pet.totalCents)}
            </div>
          </div>
        </div>

        {pet.boast && <p className="mt-3 text-base italic text-mute">“{pet.boast}”</p>}
        <div className="mt-3">
          <OwnerLine
            ownerName={pet.ownerName}
            country={pet.country}
            ownerPhotoUrl={pet.ownerPhotoUrl}
            size="md"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-line pt-4 text-xs text-mute">
          <span>{pet.clicks.toLocaleString()} views</span>
          <span>·</span>
          <span>Added {new Date(pet.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Share Card Trigger (Only generates when user explicitly clicks) */}
      <div className="mt-6 border-t border-line pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-ink">Share Card</div>
            <p className="text-xs text-mute mt-0.5">
              Generate an official shareable card for {pet.name}
            </p>
          </div>
          <ShareButtons pet={pet} />
        </div>
      </div>
    </section>
  );
}
