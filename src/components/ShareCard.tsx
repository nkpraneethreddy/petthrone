"use client";

import { useEffect } from "react";
import type { RankedPet } from "@/lib/types";
import { ShareButtons } from "./ShareButtons";

export function ShareCard({
  pet,
}: {
  pet: RankedPet;
  nextThrone: number;
}) {
  useEffect(() => {
    fetch(`/api/pets/${pet.id}/click`, { method: "POST" }).catch(() => undefined);
  }, [pet.id]);

  return (
    <section>
      <div className="bg-[#121512] p-4 text-[#f5f1e8] shadow-xl sm:p-6">
        <div className="flex aspect-square flex-col items-center border border-[#c8aa62] px-6 py-8 text-center sm:px-10 sm:py-10">
          <div className="text-[10px] tracking-[0.18em] text-[#d7bb78] sm:text-xs">
            PETTHRONE
          </div>

          <div className="mt-8 aspect-square w-[42%] overflow-hidden rounded-full border-[12px] border-[#1e2921] bg-[#2b372d] p-2 sm:mt-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pet.photoUrl || "/seed/bean.svg"}
              alt={pet.name}
              className="h-full w-full rounded-full object-cover"
            />
          </div>

          <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-normal sm:text-5xl">
            {pet.name}
          </h1>

          <p className="mt-5 text-sm sm:text-base">
            {pet.rank ? `Rank #${pet.rank}` : "Unranked"}
            {pet.country ? ` · ${pet.country}` : ""}
          </p>
          {pet.boast && (
            <p className="mt-4 max-w-md text-xs leading-5 text-[#c8c8c0] sm:text-sm">
              {pet.boast}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <ShareButtons pet={pet} />
      </div>
    </section>
  );
}
