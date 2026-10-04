import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-paper p-8 text-center shadow-sm">
        <p className="font-[family-name:var(--font-display)] text-5xl font-black text-emerald">
          404
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-ink">
          No pet sits here
        </h1>
        <p className="mt-2 text-sm text-mute">
          This page does not exist, or the listing was removed.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-2xl bg-emerald px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0c7c5c]"
          >
            See the throne
          </Link>
          <Link
            href="/countries"
            className="rounded-2xl border border-line px-5 py-3 text-sm font-bold text-ink transition-colors hover:border-ink"
          >
            Country rankings
          </Link>
        </div>
      </div>
    </main>
  );
}
