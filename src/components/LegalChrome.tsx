import Link from "next/link";
import { Logo } from "./Logo";
import { SiteFooter } from "./SiteFooter";
import { ThemeToggle } from "./ThemeToggle";

export function LegalChrome({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line/80 bg-canvas">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="leading-none">
              <span className="block font-[family-name:var(--font-display)] text-xl font-black tracking-tight">
                PetThrone
              </span>
              <span className="text-[11px] text-mute">The richest pet on the web</span>
            </span>
          </Link>
          <nav className="flex items-center gap-3 text-xs font-semibold text-mute">
            <Link href="/rules" className="hover:text-ink">
              Rules
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs font-semibold text-emerald">Effective {updated}</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-black tracking-tight">
          {title}
        </h1>
        <div className="prose-legal mt-8 space-y-6 text-[15px] leading-7 text-ink">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
