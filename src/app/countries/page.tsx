import type { Metadata } from "next";
import { Suspense } from "react";
import { getCountryBoard } from "@/lib/store";
import { CountryLeaderboard } from "@/components/CountryLeaderboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Country Leaderboards — PetThrone",
  description:
    "Top 10 pets by country on PetThrone. Country rankings by paid tribute. The throne is always worldwide at #1.",
  openGraph: {
    title: "Country Leaderboards — PetThrone",
    description: "Top 10 pets by country on PetThrone. The throne is always worldwide at #1.",
    type: "website",
  },
};

export default async function CountriesPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const { country } = await searchParams;
  const initialData = await getCountryBoard(country);

  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas p-8 text-center text-mute">Loading country rankings…</div>}>
      <CountryLeaderboard initialData={initialData} />
    </Suspense>
  );
}
