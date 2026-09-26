"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { dollars, MIN_BID_CENTS } from "@/lib/money";
import type { RankedPet } from "@/lib/types";

const PRESETS = [3, 5, 10, 25];

export function BoostModal({
  pet,
  isOpen,
  onClose,
}: {
  pet: RankedPet | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState(MIN_BID_CENTS / 100);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !pet) return null;

  const nextTotal = pet.totalCents + Math.round(amount) * 100;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pet) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("mode", "boost");
      form.set("petId", pet.id);
      form.set("email", email);
      form.set("amount", String(Math.round(amount)));
      form.set("acceptedLegal", "1");
      const res = await fetch("/api/checkout", { method: "POST", body: form });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok) throw new Error(data.error || "Payment failed.");
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("Could not start payment.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-line bg-paper p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald">Boost</div>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-ink">
              Help {pet.name} climb
            </h2>
            <p className="mt-1 text-sm text-mute">
              Your payment adds to their total. You do not take their seat.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-canvas p-2 text-mute hover:text-ink"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="mt-1.5 w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-teal"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setAmount(n)}
                className={`rounded-xl border py-2 text-xs font-bold ${
                  amount === n
                    ? "border-emerald bg-emerald text-white"
                    : "border-line bg-canvas text-ink hover:border-emerald/40"
                }`}
              >
                ${n}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink">Amount</label>
            <div className="relative mt-1.5">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-mute">$</span>
              <input
                required
                type="number"
                min={MIN_BID_CENTS / 100}
                step={1}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-2xl border border-line bg-canvas py-3 pl-9 pr-4 font-[family-name:var(--font-display)] text-2xl font-bold text-ink outline-none focus:border-emerald"
              />
            </div>
            <p className="mt-1 text-[11px] text-mute">
              Min ${MIN_BID_CENTS / 100}. New total {dollars(nextTotal)}. Not refunded.
            </p>
          </div>

          <label className="flex items-start gap-3 text-xs leading-5 text-ink">
            <input
              type="checkbox"
              required
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-emerald"
            />
            <span>
              I am 18+ and accept the{" "}
              <Link href="/rules" target="_blank" className="font-bold text-emerald">
                Rules
              </Link>
              ,{" "}
              <Link href="/terms" target="_blank" className="font-bold text-emerald">
                Terms
              </Link>
              , and{" "}
              <Link href="/privacy" target="_blank" className="font-bold text-emerald">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {error && (
            <div className="rounded-xl border border-vermillion/30 bg-vermillion/10 p-3 text-sm font-semibold text-vermillion">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !accepted}
            className="w-full rounded-2xl bg-emerald py-3.5 font-[family-name:var(--font-display)] text-lg font-bold text-white disabled:opacity-60"
          >
            {busy ? "Paying…" : `Boost ${pet.name} · ${dollars(Math.round(amount) * 100)}`}
          </button>
        </form>
      </div>
    </div>
  );
}
