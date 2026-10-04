"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChallengeModal } from "./BidForm";
import { BoostModal } from "./BoostModal";
import { CourtStage } from "./CourtStage";
import { LiveFeed } from "./LiveFeed";
import { Logo } from "./Logo";
import { OwnerLine } from "./OwnerLine";
import { RankBoard } from "./RankBoard";
import { ShareButtons } from "./ShareButtons";
import { SiteFooter } from "./SiteFooter";
import { ThemeToggle } from "./ThemeToggle";
import { dollars } from "@/lib/money";
import { sizedPhoto } from "@/lib/photos";
import { createSupabaseBrowser } from "@/lib/supabase";
import type { CourtState, MeState, RankedPet } from "@/lib/types";

export function Hall({
  initialCourt,
  initialMe,
}: {
  initialCourt: CourtState;
  initialMe: MeState;
}) {
  const [court, setCourt] = useState(initialCourt);
  const [me, setMe] = useState(initialMe);
  const [amount, setAmount] = useState(initialCourt.nextThroneCents / 100);
  const [flash, setFlash] = useState(false);
  const [selectedPet, setSelectedPet] = useState<RankedPet | null>(null);

  // Modal challenge state (only shown when a user clicks to take that position)
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [challengeRank, setChallengeRank] = useState(1);
  const [challengeTargetName, setChallengeTargetName] = useState<string | undefined>();
  const [boostPet, setBoostPet] = useState<RankedPet | null>(null);

  const kingId = useRef(initialCourt.king?.id);

  useEffect(() => {
    let sessionId = "";
    try {
      sessionId = sessionStorage.getItem("pt-sid") || crypto.randomUUID();
      sessionStorage.setItem("pt-sid", sessionId);
    } catch {
      sessionId = crypto.randomUUID();
    }

    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, first: true }),
    })
      .then((r) => r.json())
      .then((data: { visitors?: number; visitorsToday?: number; online?: number }) => {
        setCourt((c) => ({
          ...c,
          visitors: data.visitors ?? c.visitors,
          visitorsToday: data.visitorsToday ?? c.visitorsToday,
          online: data.online ?? c.online,
        }));
      })
      .catch(() => undefined);

    const beat = setInterval(() => {
      fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, first: false }),
      }).catch(() => undefined);
    }, 20000);

    return () => clearInterval(beat);
  }, []);

  useEffect(() => {
    let stopped = false;

    function boardSig(c: CourtState) {
      return (
        c.court.map((p) => `${p.id}:${p.rank}:${p.totalCents}`).join("|") +
        "#" +
        (c.events[0]?.id ?? "") +
        "#" +
        c.challengers.length
      );
    }

    async function pull() {
      if (stopped || document.hidden) return;
      const res = await fetch("/api/court");
      if (!res.ok || stopped) return;
      const next = (await res.json()) as CourtState;
      if (kingId.current && next.king?.id && next.king.id !== kingId.current) {
        setFlash(true);
        window.setTimeout(() => setFlash(false), 1400);
      }
      kingId.current = next.king?.id;
      setCourt((current) => {
        if (boardSig(current) !== boardSig(next)) return next;
        if (
          current.online === next.online &&
          current.visitors === next.visitors &&
          current.visitorsToday === next.visitorsToday &&
          current.treasuryCents === next.treasuryCents
        ) {
          return current;
        }
        return {
          ...current,
          online: next.online,
          visitors: next.visitors,
          visitorsToday: next.visitorsToday,
          treasuryCents: next.treasuryCents,
        };
      });
    }
    const t = setInterval(pull, 12000);
    const onVisible = () => {
      if (!document.hidden) void pull();
    };
    document.addEventListener("visibilitychange", onVisible);
    const sb = createSupabaseBrowser();
    const channel = sb
      ?.channel("court")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bids" },
        () => {
          void pull();
        },
      )
      .subscribe();
    return () => {
      stopped = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
      if (sb && channel) void sb.removeChannel(channel);
    };
  }, []);

  const selectPet = useCallback((pet: RankedPet) => setSelectedPet(pet), []);

  function claim(rank: number, cents: number, petName?: string) {
    setAmount(Math.max(1, Math.ceil(cents / 100)));
    setChallengeRank(rank);
    setChallengeTargetName(petName);
    setIsChallengeOpen(true);
  }

  async function refreshMe() {
    const res = await fetch("/api/auth");
    if (res.ok) setMe((await res.json()) as MeState);
  }

  const king = court.king || court.court[0];

  return (
    <div className="relative min-h-screen bg-canvas text-ink antialiased">
      {flash && (
        <div className="dethrone-flash fixed inset-0 z-50 pointer-events-none" />
      )}

      {/* Top Navbar with Compact Live Stats */}
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
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
                </span>
                <strong className="font-semibold text-ink">{Math.max(1, court.online || 1)}</strong>
                <span>online</span>
              </span>
              <span className="text-line">·</span>
              <span>
                <strong className="font-semibold text-ink">
                  {(court.visitorsToday || 0).toLocaleString()}
                </strong>{" "}
                visitors today
              </span>
              <a href="#board" className="font-semibold text-ink hover:text-emerald">
                stats →
              </a>
              <Link href="/countries" className="font-semibold text-ink hover:text-emerald">
                countries
              </Link>
              <Link href="/rules" className="font-semibold text-ink hover:text-emerald">
                rules
              </Link>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => claim(1, court.nextThroneCents, king?.name)}
              className="rounded-full bg-vermillion px-4 py-2 text-xs font-black text-white shadow-sm transition-all hover:bg-[#c93222] active:scale-95"
            >
              {king ? `Outbid #1 · ${dollars(court.nextThroneCents)}` : `Claim #1 · ${dollars(court.nextThroneCents)}`}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 md:px-6 md:pt-8">
        {/* 1. ROYAL COURT ARENA - MOVED DIRECTLY TO THE TOP */}
        <section>
          <h1 className="mb-4 text-center font-[family-name:var(--font-display)] text-3xl font-black tracking-tight text-ink md:text-5xl">
            The richest pet on the web
          </h1>
          <CourtStage pets={court.court} flash={flash} onSelectPet={selectPet} />
        </section>

        <section id="board" className="mt-10">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-bold text-ink">
            Worldwide Top 10
          </h2>

          {court.court.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line bg-paper px-6 py-12 text-center">
              <p className="font-[family-name:var(--font-display)] text-xl font-bold text-ink">
                No pets on the board yet
              </p>
              <p className="mt-2 text-sm text-mute">
                Take #1 for {dollars(court.nextThroneCents)}. Bids are final.
              </p>
              <button
                type="button"
                onClick={() => claim(1, court.nextThroneCents)}
                className="mt-5 rounded-full bg-vermillion px-5 py-2.5 text-xs font-black text-white hover:bg-[#c93222]"
              >
                Claim #1 · {dollars(court.nextThroneCents)}
              </button>
            </div>
          ) : (
            <RankBoard
              board={court.court}
              onClaim={(rank, cents) => {
                const target = court.court.find((p) => p.rank === rank);
                claim(rank, cents, target?.name);
              }}
              onBoost={(pet) => setBoostPet(pet)}
            />
          )}
        </section>

        {/* 5. CHALLENGERS UNDER THE COURT */}
        {court.challengers.length > 0 && (
          <section className="mt-12">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-ink">
              Challengers
            </h2>

            <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-paper shadow-sm">
              {court.challengers.map((pet) => (
                <div
                  key={pet.id}
                  className="flex items-center justify-between p-4 text-sm transition-colors hover:bg-paper/40"
                >
                  <Link href={`/pets/${pet.id}`} className="flex items-center gap-3">
                    <span className="w-8 font-mono text-xs font-bold text-mute">
                      #{pet.rank}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sizedPhoto(pet.photoUrl, 96)}
                      alt={pet.name}
                      className="h-10 w-10 rounded-xl object-cover"
                    />
                    <div>
                      <div className="font-bold text-ink">{pet.name}</div>
                      <OwnerLine
                        ownerName={pet.ownerName}
                        country={pet.country}
                        ownerPhotoUrl={pet.ownerPhotoUrl}
                      />
                    </div>
                  </Link>

                  <div className="flex items-center gap-4">
                    <span className="font-bold text-ink">{dollars(pet.totalCents)}</span>
                    <button
                      type="button"
                      onClick={() => setBoostPet(pet)}
                      className="rounded-xl border border-line px-3 py-1.5 text-xs font-bold text-emerald hover:border-emerald"
                    >
                      Boost
                    </button>
                    <button
                      type="button"
                      onClick={() => claim(pet.rank, pet.totalCents + 100, pet.name)}
                      className="rounded-xl border border-line px-3 py-1.5 text-xs font-bold text-vermillion hover:border-vermillion hover:bg-vermillion/5"
                    >
                      Outbid
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {court.events.length > 0 && (
          <div className="mt-14">
            <LiveFeed events={court.events} />
          </div>
        )}

        {/* Pet Inspection Modal (when a pet is clicked in 3D or leaderboard) */}
        {selectedPet && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setSelectedPet(null)}
          >
            <div
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-paper p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedPet(null)}
                className="absolute right-4 top-4 rounded-full bg-paper p-2 text-mute hover:text-ink"
              >
                ✕
              </button>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald/15 font-[family-name:var(--font-display)] text-xl font-bold text-emerald">
                  #{selectedPet.rank}
                </span>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                    {selectedPet.name}
                  </h3>
                  <div className="text-xs font-bold text-emerald">
                    {dollars(selectedPet.totalCents)} · {selectedPet.clicks} views
                  </div>
                  <div className="mt-1">
                    <OwnerLine
                      ownerName={selectedPet.ownerName}
                      country={selectedPet.country}
                      ownerPhotoUrl={selectedPet.ownerPhotoUrl}
                    />
                  </div>
                </div>
              </div>

              {/* 2-3 Photos Gallery */}
              <div className="mt-5 grid grid-cols-3 gap-2">
                {(selectedPet.photos || [selectedPet.photoUrl]).map((url, idx) => (
                  <div
                    key={idx}
                    className="aspect-square overflow-hidden rounded-xl border border-line bg-paper"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>

              <p className="mt-4 text-sm italic text-mute border-l-2 border-emerald pl-3">
                “{selectedPet.boast}”
              </p>

              <div className="mt-5">
                <ShareButtons pet={selectedPet} compact />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setBoostPet(selectedPet);
                    setSelectedPet(null);
                  }}
                  className="flex-1 rounded-xl bg-emerald py-3 text-center text-xs font-bold text-white"
                >
                  Boost
                </button>
                <button
                  type="button"
                  onClick={() => {
                    claim(selectedPet.rank, selectedPet.totalCents + 100, selectedPet.name);
                    setSelectedPet(null);
                  }}
                  className="flex-1 rounded-xl bg-vermillion py-3 text-center text-xs font-bold text-white hover:bg-[#c93222] shadow-md shadow-vermillion/20"
                >
                  Outbid #{selectedPet.rank}
                </button>
              </div>
              <Link
                href={`/pets/${selectedPet.id}`}
                className="mt-3 block text-center text-xs font-bold text-teal transition-colors hover:text-ink"
              >
                View full profile
              </Link>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />

      {/* Floating Action Pill Bar */}
      <aside
        aria-label="Quick outbid actions"
        className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-line bg-paper/95 px-4 py-2.5 shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">👑</span>
          <span className="text-xs font-bold text-ink">
            {king ? `${king.name} (${dollars(king.totalCents)})` : "Open throne"}
          </span>
        </div>
        <span className="text-line">|</span>
        <button
          onClick={() => claim(1, court.nextThroneCents, king?.name)}
          className="rounded-full bg-vermillion px-3.5 py-1 text-xs font-black text-white shadow-sm transition-all hover:bg-[#c93222] active:scale-95"
        >
          {king ? `Take #1 · ${dollars(court.nextThroneCents)}` : `Claim #1 · ${dollars(court.nextThroneCents)}`}
        </button>
      </aside>

      {/* Focused Challenge Modal (ONLY shown when user clicks to take a position) */}
      <BoostModal pet={boostPet} isOpen={Boolean(boostPet)} onClose={() => setBoostPet(null)} />

      <ChallengeModal
        court={court}
        me={me}
        amount={amount}
        targetRank={challengeRank}
        targetPetName={challengeTargetName}
        isOpen={isChallengeOpen}
        onClose={() => setIsChallengeOpen(false)}
        onAmount={setAmount}
        onDone={(next) => {
          setCourt(next);
          void refreshMe();
          if (kingId.current && next.king?.id !== kingId.current) {
            setFlash(true);
            window.setTimeout(() => setFlash(false), 1400);
          }
          kingId.current = next.king?.id;
        }}
      />
    </div>
  );
}
