"use client";

import { useState } from "react";
import { BoostModal } from "@/components/BoostModal";
import type { RankedPet } from "@/lib/types";
import { dollars } from "@/lib/money";

export function PetActions({ pet }: { pet: RankedPet }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-emerald px-6 py-4 text-center font-[family-name:var(--font-display)] text-base font-bold text-white"
      >
        Boost {pet.name}
      </button>
      <p className="mt-2 text-xs text-mute sm:hidden">
        Add {dollars(300)} or more to their total. You keep no seat.
      </p>
      <BoostModal pet={pet} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
