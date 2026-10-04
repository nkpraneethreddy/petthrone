"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-paper p-8 text-center shadow-sm">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-ink">
          The court is briefly closed
        </h1>
        <p className="mt-2 text-sm text-mute">
          Something went wrong on our side. Your bids and rankings are safe.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-mute">Ref {error.digest}</p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => retry()}
            className="rounded-2xl bg-emerald px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0c7c5c]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-2xl border border-line px-5 py-3 text-sm font-bold text-ink transition-colors hover:border-ink"
          >
            Back to the throne
          </Link>
        </div>
      </div>
    </main>
  );
}
