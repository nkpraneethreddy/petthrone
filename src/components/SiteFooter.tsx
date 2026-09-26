import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-canvas px-4 py-8 pb-24">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-[family-name:var(--font-display)] text-lg font-black text-ink">
            PetThrone
          </div>
          <p className="text-sm text-mute">The richest pet on the web</p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-mute">
          <Link href="/countries" className="hover:text-ink">
            Countries
          </Link>
          <Link href="/rules" className="hover:text-ink">
            Rules
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
