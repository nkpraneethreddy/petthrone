"use client";

import dynamic from "next/dynamic";
import { memo, useState } from "react";
import type { RankedPet } from "@/lib/types";

const CourtCanvas = dynamic(
  () => import("./CourtCanvas").then((mod) => mod.CourtCanvas),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-emerald/5" />,
  },
);

export const CourtStage = memo(function CourtStage({
  pets,
  flash,
  onSelectPet,
}: {
  pets: RankedPet[];
  flash: boolean;
  onSelectPet?: (pet: RankedPet) => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl border border-line bg-canvas shadow-[0_20px_60px_-15px_rgba(15,143,107,0.12)] ${
        isFullscreen ? "fixed inset-0 z-50 h-screen rounded-none" : "h-[520px] md:h-[620px]"
      }`}
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 50% 38%, rgba(25,211,162,0.16), rgba(26,163,196,0.06) 38%, transparent 65%)",
      }}
    >
      <CourtCanvas pets={pets} flash={flash} onSelectPet={onSelectPet} />

      <button
        type="button"
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="absolute right-3 top-3 z-20 rounded-full border border-line/70 bg-paper/70 p-2 text-mute backdrop-blur-md transition-all hover:bg-paper hover:text-ink"
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        )}
      </button>
    </div>
  );
});
