import Link from "next/link";
import { SoteriaLogo } from "./SoteriaLogo";

/**
 * Persistent brand header shown on every page. No navigation beyond the
 * logo linking home — V1 is a single-page tool (landing → calculator), so
 * this deliberately does not carry links to features that don't exist yet
 * (invoices, dashboard, etc. — see docs/roadmap.md).
 */
export function SiteHeader() {
  return (
    <header className="border-b border-soteria-border bg-soteria-bg/95 print:border-slate-200 print:bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="transition-opacity hover:opacity-90">
          <SoteriaLogo className="h-9 w-9" withWordmark />
        </Link>
        <span className="hidden text-xs font-medium uppercase tracking-[0.14em] text-soteria-faint sm:inline print:hidden">
          Internal estimation tool
        </span>
      </div>
    </header>
  );
}
