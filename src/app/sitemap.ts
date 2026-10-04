import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getCourt } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl();
  const court = await getCourt();
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: origin, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${origin}/countries`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${origin}/rules`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${origin}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  for (const pet of court.court) {
    pages.push({
      url: `${origin}/pets/${pet.id}`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: pet.rank === 1 ? 0.9 : 0.6,
    });
  }

  return pages;
}
