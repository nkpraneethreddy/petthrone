import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dollars, nextThroneCents } from "@/lib/money";
import { getPet } from "@/lib/store";
import { Logo } from "@/components/Logo";
import { ShareCard } from "@/components/ShareCard";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PetActions } from "./PetActions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pet = await getPet(id);
  if (!pet) return { title: "PetThrone" };
  const title = `${pet.name} — #${pet.rank || "?"} on PetThrone`;
  const description = `${pet.name} is ${pet.rank ? `#${pet.rank}` : "unranked"} at ${dollars(pet.totalCents)}. ${pet.boast || "The richest pet on the web."}`;
  const image = `/api/og/${pet.id}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1024, height: 1024 }],
      type: "website",
    },
  };
}

export default async function PetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pet = await getPet(id);
  if (!pet) notFound();

  const nextCost = nextThroneCents(pet.totalCents);
  const snapshot = new Date().toISOString().replace("T", " ").slice(0, 16);

  return (
    <div className="min-h-screen bg-canvas pt-8">
      <div className="mx-auto max-w-[720px] px-4">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-teal transition-colors hover:text-ink"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
          <span className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-bold">
            <Logo size={28} />
            PetThrone
          </span>
          <ThemeToggle />
        </div>

        <div className="mt-8">
          <ShareCard pet={pet} nextThrone={nextCost} snapshot={snapshot} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-emerald/20 bg-emerald/5 p-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald">Like this pet?</span>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-ink">
              Boost {pet.name}
            </h2>
            <p className="mt-1 text-sm text-mute">
              Anyone can pay to raise their total. You do not take their seat.
            </p>
            <div className="mt-4">
              <PetActions pet={pet} />
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-vermillion/20 bg-vermillion/5 p-6">
            <span className="text-xs font-bold uppercase tracking-wider text-vermillion">
              Want this rank?
            </span>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-ink">
              Outbid {pet.name}
            </h2>
            <p className="mt-1 text-sm text-mute">
              {pet.rank === 1
                ? `Pay ${dollars(nextCost)} to take #1 with your own pet.`
                : `Beat ${dollars(pet.totalCents)} with your own pet.`}
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center justify-center rounded-2xl bg-vermillion px-6 py-4 font-[family-name:var(--font-display)] text-base font-bold text-white hover:bg-[#c93222]"
            >
              Outbid {pet.name}
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-12">
        <SiteFooter />
      </div>
    </div>
  );
}
