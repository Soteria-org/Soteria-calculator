import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="chip mb-4">Internal tool — not client-facing</p>
      <h1 className="text-3xl font-bold text-slate-900">Soteria Calculator</h1>
      <p className="mt-3 text-slate-600">
        Scope → effort → cost → price → deposit → timeline, with every number
        traceable. No AI guesses, no hidden markup — just Soteria&apos;s pricing
        rules, applied consistently.
      </p>
      <Link href="/calculator" className="btn-primary mt-8">
        Start a new estimate
      </Link>
      <p className="field-hint mt-6 max-w-md">
        Runs entirely in your browser. Pricing rules live in{" "}
        <code>/config</code> — edit them there, not in a spreadsheet, so every
        future estimate uses the same logic.
      </p>
    </main>
  );
}
