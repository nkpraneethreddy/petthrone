"use client";

import Link from "next/link";
import { useState } from "react";
import { claimCentsForRank, dollars } from "@/lib/money";
import { sizedPhoto } from "@/lib/photos";
import type { RankedPet } from "@/lib/types";
import { Ago, Reign } from "./Ago";
import { OwnerLine } from "./OwnerLine";

function PetCardPhotos({
  photos,
  name,
  isKing,
}: {
  photos: string[];
  name: string;
  isKing?: boolean;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const displayPhotos = photos && photos.length > 0 ? photos : ["/seed/bean.svg"];

  return (
    <div className="flex flex-col gap-2">
      {/* Main photo view */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-paper ${
          isKing ? "aspect-square w-28 md:w-36" : "aspect-square w-20 md:w-24"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sizedPhoto(displayPhotos[activeIdx] || displayPhotos[0], 320)}
          alt={`${name} portrait ${activeIdx + 1}`}
          decoding="async"
          className="h-full w-full object-cover transition-all duration-300 hover:scale-105"
        />

        {displayPhotos.length > 1 && (
          <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-black/40 px-1.5 py-0.5 backdrop-blur-sm">
            {displayPhotos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveIdx(i);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIdx ? "w-3 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mini 2-3 photo thumbnail strip if pet has multiple photos */}
      {displayPhotos.length > 1 && (
        <div className="flex gap-1">
          {displayPhotos.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveIdx(i);
              }}
              className={`h-6 w-6 overflow-hidden rounded-md border transition-all ${
                i === activeIdx ? "border-emerald ring-1 ring-emerald" : "border-line opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sizedPhoto(url, 64)} alt="" decoding="async" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RankBoard({
  board,
  onClaim,
  onBoost,
}: {
  board: RankedPet[];
  onClaim: (rank: number, cents: number) => void;
  onBoost?: (pet: RankedPet) => void;
}) {
  return (
    <div className="space-y-4">
      {board.map((pet) => {
        const claim = claimCentsForRank(pet.rank, board);
        const isKing = pet.rank === 1;
        const isTop3 = pet.rank <= 3;
        const photos = pet.photos && pet.photos.length > 0 ? pet.photos : [pet.photoUrl];

        const rankBadgeColor = isKing
          ? "bg-emerald text-white shadow-emerald/30"
          : pet.rank === 2
            ? "bg-steel text-white shadow-steel/20"
            : pet.rank === 3
              ? "bg-copper text-white shadow-copper/20"
              : "bg-paper text-ink";

        return (
          <div
            key={pet.id}
            id={`rank-${pet.rank}`}
            className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 hover:shadow-xl ${
              isKing
                ? "border-emerald/40 bg-gradient-to-r from-emerald/5 via-paper to-paper p-6 shadow-lg shadow-emerald/5 hover:border-emerald"
                : isTop3
                  ? "border-line/90 bg-paper p-5 shadow-sm hover:border-teal/50"
                  : "border-line bg-paper/80 p-4 hover:border-line hover:bg-paper"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4 sm:items-center sm:gap-6">
                {/* Rank number badge */}
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-[family-name:var(--font-display)] text-xl font-black shadow-sm ${rankBadgeColor} ${
                    isKing ? "h-14 w-14 text-2xl" : ""
                  }`}
                >
                  #{pet.rank}
                </div>

                {/* 2-3 Multi-photo viewer */}
                <PetCardPhotos photos={photos} name={pet.name} isKing={isKing} />

                {/* Pet information */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/pets/${pet.id}`}
                      className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-ink transition-colors hover:text-emerald md:text-2xl"
                    >
                      {pet.name}
                    </Link>
                    {isKing && (
                      <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-bold text-emerald">
                        King
                      </span>
                    )}
                  </div>

                  <p className="mt-1 line-clamp-2 text-sm text-mute">{pet.boast}</p>
                  <div className="mt-2">
                    <OwnerLine
                      ownerName={pet.ownerName}
                      country={pet.country}
                      ownerPhotoUrl={pet.ownerPhotoUrl}
                    />
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-mute">
                    <span className="font-semibold text-ink">
                      {isKing ? <Reign iso={pet.crownedAt} /> : <Ago iso={pet.createdAt} />}
                    </span>
                    <span>·</span>
                    <span>{pet.clicks.toLocaleString()} views</span>
                    <span>·</span>
                    <Link
                      href={`/pets/${pet.id}`}
                      className="font-semibold text-teal underline-offset-2 hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>

              {/* Net Worth & Quick Outbid Button */}
              <div className="flex items-center justify-between border-t border-line/60 pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                <div className="text-left sm:text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-mute">
                    Total
                  </div>
                  <div
                    className={`font-[family-name:var(--font-display)] text-2xl font-bold leading-none ${
                      isKing ? "text-3xl text-emerald md:text-4xl" : "text-ink"
                    }`}
                  >
                    {dollars(pet.totalCents)}
                  </div>
                </div>

                <div className="mt-2 flex flex-col items-stretch gap-2 sm:items-end">
                  {onBoost && (
                    <button
                      type="button"
                      onClick={() => onBoost(pet)}
                      className="rounded-xl border border-emerald/30 bg-emerald/10 px-4 py-2 text-xs font-bold text-emerald hover:bg-emerald hover:text-white"
                    >
                      Boost
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onClaim(pet.rank, claim)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm active:scale-95 ${
                      isKing
                        ? "bg-vermillion text-white hover:bg-[#c93222] shadow-vermillion/20 hover:shadow-md"
                        : "border border-line bg-canvas text-ink hover:border-vermillion hover:bg-vermillion hover:text-white"
                    }`}
                  >
                    Outbid {dollars(claim)}
                  </button>
                  <Link
                    href={`/pets/${pet.id}`}
                    className="text-center text-[11px] font-bold text-mute transition-colors hover:text-ink"
                  >
                    View profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
