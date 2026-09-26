"use client";

import { useEffect } from "react";
import type { RankedPet } from "@/lib/types";
import { ShareButtons } from "./ShareButtons";

export function ShareCard({
  pet,
  snapshot,
}: {
  pet: RankedPet;
  nextThrone: number;
  snapshot?: string;
}) {
  const displaySnapshot = snapshot || new Date().toISOString().replace("T", " ").slice(0, 16);

  useEffect(() => {
    fetch(`/api/pets/${pet.id}/click`, { method: "POST" }).catch(() => undefined);
  }, [pet.id]);

  return (
    <section>
      <div className="bg-[#121512] p-4 text-[#f5f1e8] shadow-xl sm:p-6">
        <div className="flex min-h-[580px] w-full flex-col items-center justify-between border border-[#c8aa62] px-6 py-8 text-center sm:min-h-[640px] sm:px-10 sm:py-10">
          <div className="text-[10px] tracking-[0.18em] text-[#d7bb78] sm:text-xs">
            PETTHRONE
          </div>

          <div className="my-6 aspect-square w-36 overflow-hidden rounded-full border-[10px] border-[#1e2921] bg-[#2b372d] p-1.5 sm:w-44 sm:border-[12px] sm:p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pet.photoUrl || "/seed/bean.svg"}
              alt={pet.name}
              className="h-full w-full rounded-full object-cover"
            />
          </div>

          <div className="w-full">
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-normal sm:text-5xl">
              {pet.name}
            </h1>

            <p className="mt-4 text-sm sm:text-base">
              {pet.rank ? `#${pet.rank} worldwide` : "Unranked"}
            </p>
            {pet.boast && (
              <p className="mx-auto mt-3 max-w-md text-xs leading-5 text-[#c8c8c0] sm:text-sm">
                {pet.boast}
              </p>
            )}
          </div>

          <div className="mt-8 text-[11px] tracking-wider text-[#c8c8c0]">
            Snapshot {displaySnapshot} UTC
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ShareButtons pet={pet} />
      </div>
    </section>
  );
}
