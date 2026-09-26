"use client";

import { dollars } from "@/lib/money";
import type { FeedEvent } from "@/lib/types";
import { Ago } from "./Ago";

export function LiveFeed({ events }: { events: FeedEvent[] }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-paper p-6 shadow-sm md:p-8">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal" />
          </span>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-ink">
            Activity
          </h2>
        </div>
        <span className="text-xs font-semibold text-mute">Live</span>
      </div>

      <div className="mt-4 divide-y divide-line/60">
        {events.slice(0, 15).map((ev) => {
          const isDethrone = ev.kind === "dethrone";
          const isCrown = ev.kind === "crown";
          const isBoost = ev.kind === "boost";

          return (
            <div
              key={ev.id}
              className="flex items-center justify-between py-3.5 text-sm transition-colors hover:bg-paper/50"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                    isDethrone
                      ? "bg-vermillion/10 text-vermillion"
                      : isCrown
                        ? "bg-emerald/10 text-emerald"
                        : isBoost
                          ? "bg-emerald/10 text-emerald"
                          : "bg-teal/10 text-teal"
                  }`}
                >
                  {isDethrone ? "⚔️" : isCrown ? "👑" : isBoost ? "↑" : "💰"}
                </span>

                <div className="min-w-0">
                  <div className="font-medium text-ink">
                    {isDethrone ? (
                      <>
                        <strong className="text-vermillion">{ev.actorName}</strong> dethroned{" "}
                        <span className="line-through text-mute">{ev.victimName}</span>
                      </>
                    ) : isCrown ? (
                      <>
                        <strong className="text-emerald">{ev.actorName}</strong> took the throne
                      </>
                    ) : isBoost ? (
                      <>
                        A fan boosted <strong className="text-emerald">{ev.actorName}</strong>
                      </>
                    ) : (
                      <>
                        <strong className="text-ink">{ev.actorName}</strong> bid
                      </>
                    )}
                  </div>
                  <div className="text-xs text-mute">
                    <Ago iso={ev.createdAt} />
                  </div>
                </div>
              </div>

              <div className="font-[family-name:var(--font-display)] text-base font-bold text-ink">
                +{dollars(ev.amountCents)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
