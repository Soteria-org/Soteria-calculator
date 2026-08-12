// Soteria's mark, redrawn as inline SVG from the brand kit (logo + colour
// palette) captured in Bloom: a navy calculator body, a rising bar chart,
// and a teal underline swoosh, on Soteria's teal/navy/gold palette.
// Inline SVG rather than a raster export so it stays crisp at any size and
// needs no binary asset in the repo.

interface SoteriaLogoProps {
  className?: string;
  /** Renders the wordmark next to the mark. Off by default for tight spaces (favicon-style use). */
  withWordmark?: boolean;
}

export function SoteriaLogo({ className = "h-8 w-8", withWordmark = false }: SoteriaLogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        viewBox="0 0 48 48"
        className={className}
        role="img"
        aria-label="Soteria"
      >
        <rect x="4" y="4" width="40" height="40" rx="10" fill="#153A5F" />
        <rect x="12" y="11" width="24" height="26" rx="3" fill="#FFFFFF" />
        <rect x="15.5" y="14.5" width="17" height="5" rx="1.5" fill="#153A5F" />
        <rect x="15.5" y="23" width="3.4" height="10" rx="1" fill="#0F787A" />
        <rect x="20.3" y="19" width="3.4" height="14" rx="1" fill="#0F787A" />
        <rect x="25.1" y="26" width="3.4" height="7" rx="1" fill="#BC9C62" />
        <rect x="29.9" y="15.5" width="3.4" height="17.5" rx="1" fill="#0F787A" />
        <path
          d="M13 39.5C18 42.5 30 42.5 35 39.5"
          stroke="#BC9C62"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight text-soteria-ink print:text-slate-900">
            Soteria
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-soteria-gold print:text-soteria-navy">
            Calculator
          </span>
        </span>
      )}
    </span>
  );
}
