"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { COUNTRIES } from "@/lib/countries";
import { dollars } from "@/lib/money";
import type { CountryBoardState, CountryRankedPet } from "@/lib/types";
import { BoostModal } from "./BoostModal";
import { Logo } from "./Logo";
import { OwnerLine } from "./OwnerLine";
import { SiteFooter } from "./SiteFooter";
import { ThemeToggle } from "./ThemeToggle";

export function CountryLeaderboard({
  initialData,
}: {
  initialData: CountryBoardState;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCountry = searchParams.get("country");

  const [currentCountry, setCurrentCountry] = useState(urlCountry || initialData.country);
  const [board, setBoard] = useState<CountryBoardState>(initialData);
  const [loading, setLoading] = useState(false);
  const [boostPet, setBoostPet] = useState<CountryRankedPet | null>(null);

  useEffect(() => {
    if (urlCountry && urlCountry !== currentCountry) {
      setCurrentCountry(urlCountry);
    }
  }, [urlCountry, currentCountry]);

  useEffect(() => {
    let active = true;
    async function loadCountry(countryName: string) {
      setLoading(true);
      try {
        const res = await fetch(`/api/country?country=${encodeURIComponent(countryName)}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load country board");
        const data = (await res.json()) as CountryBoardState;
        if (active) setBoard(data);
      } catch {
        // fallback to current board
      } finally {
        if (active) setLoading(false);
      }
    }

    if (currentCountry !== initialData.country || board.country !== currentCountry) {
      void loadCountry(currentCountry);
    }
  }, [currentCountry, initialData.country, board.country]);

  function handleSelectCountry(country: string) {
    setCurrentCountry(country);
    router.replace(`/countries?country=${encodeURIComponent(country)}`, { scroll: false });
  }

  return (
    <div className="min-h-screen bg-canvas text-ink antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5 md:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link href="/" className="flex shrink-0 items-center gap-2.5">
              <Logo size={34} />
              <span className="font-[family-name:var(--font-display)] text-[1.35rem] font-black leading-none tracking-tight text-ink">
                PetThrone
              </span>
            </Link>

            <div className="hidden items-center gap-3 text-[13px] text-mute sm:flex">
              <Link href="/" className="font-semibold text-ink hover:text-emerald">
                ← Worldwide Throne
              </Link>
              <span className="text-line">·</span>
              <span className="font-bold text-emerald">Country Leaderboards</span>
              <span className="text-line">·</span>
              <Link href="/rules" className="font-semibold text-ink hover:text-emerald">
                rules
              </Link>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="rounded-full bg-vermillion px-4 py-2 text-xs font-black text-white shadow-sm transition-all hover:bg-[#c93222] active:scale-95"
            >
              Worldwide Throne →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 md:px-6 md:pt-8">
        {/* Scope Announcement Banner */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-line bg-paper p-6 md:flex-row md:items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald">
              Regional Rankings
            </div>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-black text-ink md:text-3xl">
              {currentCountry} Top 10
            </h1>
            <p className="mt-1 text-sm text-mute">
              Local rankings by paid tribute. The official throne is always worldwide at #1.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-emerald/30 bg-emerald/10 px-4 py-2.5 text-xs font-bold text-emerald hover:bg-emerald hover:text-white transition-colors"
          >
            <span>👑</span>
            <span>View Worldwide Throne</span>
          </Link>
        </div>

        {/* Country Selector */}
        <div className="mt-8 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label htmlFor="country-select" className="text-xs font-bold uppercase tracking-wider text-mute">
              Select country
            </label>
            <span className="text-xs text-mute">
              Showing top {board.pets.length} of {board.totalPets} in {currentCountry}
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Dropdown for any country */}
            <select
              id="country-select"
              value={currentCountry}
              onChange={(e) => handleSelectCountry(e.target.value)}
              className="w-full sm:w-72 rounded-2xl border border-line bg-paper px-4 py-2.5 text-sm font-semibold text-ink outline-none transition-all focus:border-emerald focus:bg-white focus:ring-4 focus:ring-emerald/10"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Quick chips for countries with active competitors */}
            {board.availableCountries.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs text-mute mr-1">Active:</span>
                {board.availableCountries.slice(0, 6).map(({ country, count }) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => handleSelectCountry(country)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                      country.toLowerCase() === currentCountry.toLowerCase()
                        ? "border-emerald bg-emerald text-white shadow-sm"
                        : "border-line bg-paper text-ink hover:border-emerald/40 hover:bg-white"
                    }`}
                  >
                    {country} ({count})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Table / Cards */}
        <section className="mt-8">
          {loading ? (
            <div className="py-16 text-center text-sm font-semibold text-mute">
              Loading rankings for {currentCountry}…
            </div>
          ) : board.pets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line bg-paper px-6 py-16 text-center">
              <p className="font-[family-name:var(--font-display)] text-xl font-bold text-ink">
                No pets from {currentCountry} yet
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-mute">
                Be the first pet from {currentCountry} to claim #1 on this leaderboard and climb the worldwide throne.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex rounded-full bg-vermillion px-6 py-3 text-xs font-black text-white hover:bg-[#c93222] shadow-sm"
              >
                Claim Worldwide Rank →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {board.pets.map((pet) => {
                const isCountryFirst = pet.countryRank === 1;
                const photos = pet.photos && pet.photos.length > 0 ? pet.photos : [pet.photoUrl];

                return (
                  <div
                    key={pet.id}
                    className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 hover:shadow-xl ${
                      isCountryFirst
                        ? "border-emerald/40 bg-gradient-to-r from-emerald/5 via-paper to-paper p-6 shadow-lg shadow-emerald/5"
                        : "border-line bg-paper p-5 shadow-sm hover:border-line hover:bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4 sm:items-center sm:gap-6">
                        {/* Country Rank Badge */}
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-[family-name:var(--font-display)] text-xl font-black shadow-sm ${
                            isCountryFirst
                              ? "bg-emerald text-white shadow-emerald/30 h-14 w-14 text-2xl"
                              : pet.countryRank === 2
                                ? "bg-steel text-white shadow-steel/20"
                                : pet.countryRank === 3
                                  ? "bg-copper text-white shadow-copper/20"
                                  : "bg-paper text-ink border border-line"
                          }`}
                        >
                          #{pet.countryRank}
                        </div>

                        {/* Pet Photo */}
                        <div className="relative aspect-square w-20 md:w-24 shrink-0 overflow-hidden rounded-2xl bg-paper">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photos[0]}
                            alt={pet.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>

                        {/* Pet Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/pets/${pet.id}`}
                              className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-ink transition-colors hover:text-emerald md:text-2xl"
                            >
                              {pet.name}
                            </Link>

                            <span className="rounded-full bg-paper px-2.5 py-0.5 text-[11px] font-semibold text-mute border border-line">
                              #{pet.rank} worldwide
                            </span>

                            {isCountryFirst && (
                              <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-bold text-emerald">
                                #1 in {currentCountry}
                              </span>
                            )}
                          </div>

                          {pet.boast && (
                            <p className="mt-1 line-clamp-2 text-sm text-mute">{pet.boast}</p>
                          )}

                          <div className="mt-2">
                            <OwnerLine
                              ownerName={pet.ownerName}
                              country={pet.country}
                              ownerPhotoUrl={pet.ownerPhotoUrl}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Total and Actions */}
                      <div className="flex items-center justify-between border-t border-line/60 pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-mute">
                            Total
                          </div>
                          <div
                            className={`font-[family-name:var(--font-display)] text-2xl font-bold leading-none ${
                              isCountryFirst ? "text-3xl text-emerald md:text-4xl" : "text-ink"
                            }`}
                          >
                            {dollars(pet.totalCents)}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setBoostPet(pet)}
                            className="rounded-xl border border-emerald/30 bg-emerald/10 px-4 py-2 text-xs font-bold text-emerald hover:bg-emerald hover:text-white transition-colors"
                          >
                            Boost
                          </button>

                          <Link
                            href={`/pets/${pet.id}`}
                            className="rounded-xl border border-line bg-canvas px-4 py-2 text-xs font-bold text-ink hover:border-ink transition-colors"
                          >
                            Share card
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Boost Modal */}
      <BoostModal
        pet={boostPet}
        isOpen={Boolean(boostPet)}
        onClose={() => setBoostPet(null)}
      />

      <SiteFooter />
    </div>
  );
}
