// Soteria's infrastructure/tool catalogue.
//
// IMPORTANT — READ BEFORE QUOTING A CLIENT:
// The prices below are PLACEHOLDER figures for demonstrating the calculator's
// shape (provider cost → cost treatment → client charge). They have NOT been
// verified against live provider pricing pages as part of building this app.
// Before this catalogue drives a real quote, someone at Soteria must open
// each provider's pricing page, confirm the figure, and update `providerPrice`
// and `lastVerified` below. That's the whole point of storing `source` and
// `lastVerified` per item — so staleness is visible, not assumed away.
//
// Each item deliberately separates:
//   providerPrice   — what the provider actually charges Soteria
//   costTreatment    — Soteria's commercial decision (pass-through / administered / absorbed / bundled)
//   adminFeeUgx      — Soteria's fee on top, only relevant when "administered"
//   clientBillable   — whether this appears on the client's recurring cost at all
// The calculator engine (lib/calculator-engine.ts) uses these to compute the
// three numbers that matter: actual provider cost, Soteria's charge, and the
// client's total recurring cost. Never collapse those into one number.

import { InfrastructureItem } from "@/lib/types";

export const infrastructureCatalogue: InfrastructureItem[] = [
  {
    id: "infra-hosting-vercel",
    provider: "Vercel",
    service: "Hosting",
    plan: "Pro",
    providerPrice: 20,
    currency: "USD",
    billing: "monthly",
    allowance: "1 seat included, usage-based bandwidth/build minutes beyond that",
    overage: "Additional usage billed per Vercel's usage-based pricing",
    source: "PLACEHOLDER — verify at vercel.com/pricing before quoting",
    lastVerified: "2026-08-12",
    costTreatment: "administered",
    adminFeeUgx: 20_000,
    clientBillable: true,
  },
  {
    id: "infra-hosting-shared",
    provider: "Generic shared hosting",
    service: "Hosting",
    plan: "Standard",
    providerPrice: 150_000,
    currency: "UGX",
    billing: "annual",
    source: "PLACEHOLDER — replace with actual local host used",
    lastVerified: "2026-08-12",
    costTreatment: "pass-through",
    clientBillable: true,
  },
  {
    id: "infra-database-supabase",
    provider: "Supabase",
    service: "Database",
    plan: "Pro",
    providerPrice: 25,
    currency: "USD",
    billing: "monthly",
    allowance: "Included compute credits; additional projects/compute add cost",
    overage: "Compute add-ons billed per Supabase's usage pricing",
    source: "PLACEHOLDER — verify at supabase.com/pricing before quoting",
    lastVerified: "2026-08-12",
    costTreatment: "administered",
    adminFeeUgx: 25_000,
    clientBillable: true,
    notes: "Watch for additional-project/compute overages — see docs/pricing-model.md",
  },
  {
    id: "infra-domain-registration",
    provider: "Domain registrar",
    service: "Domain",
    plan: ".com / .co.ug",
    providerPrice: 60_000,
    currency: "UGX",
    billing: "annual",
    source: "PLACEHOLDER — registrar's own pricing varies by TLD",
    lastVerified: "2026-08-12",
    costTreatment: "pass-through",
    clientBillable: true,
    notes: "Some registrars (e.g. Cloudflare Registrar) charge registry cost with no markup — don't assume a fixed number across registrars.",
  },
  {
    id: "infra-email-resend",
    provider: "Resend",
    service: "Transactional email",
    plan: "Free / Pro",
    providerPrice: 0,
    currency: "USD",
    billing: "monthly",
    allowance: "Free tier covers a low-volume allowance; Pro tier is a paid step with its own allowance",
    overage: "Overage billed per Resend's plan pricing once the tier's allowance is exceeded",
    source: "PLACEHOLDER — verify at resend.com/pricing before quoting",
    lastVerified: "2026-08-12",
    costTreatment: "absorbed",
    clientBillable: false,
    notes: "Absorbed while volume stays on the free tier. Revisit cost treatment if a project's email volume forces the paid tier.",
  },
  {
    id: "infra-sms-credits",
    provider: "SMS gateway",
    service: "SMS",
    plan: "Pay-as-you-go",
    providerPrice: 35,
    currency: "UGX",
    billing: "one-time",
    allowance: "Per SMS sent",
    source: "PLACEHOLDER — verify against actual local SMS gateway rate card",
    lastVerified: "2026-08-12",
    costTreatment: "pass-through",
    clientBillable: true,
    notes: "Price is per message — the calculator multiplies by an estimated monthly volume you set per project.",
  },
  {
    id: "infra-payment-gateway",
    provider: "Payment gateway",
    service: "Payment/API",
    plan: "Standard (≈1.5% per transaction — illustrative)",
    providerPrice: 0,
    currency: "UGX",
    billing: "monthly",
    allowance: "Percentage-based transaction fee, not a flat monthly cost",
    overage: "N/A — scales with transaction volume",
    source: "PLACEHOLDER — replace with actual gateway (Flutterwave/Pesapal/MoMo/Stripe) rate",
    lastVerified: "2026-08-12",
    costTreatment: "pass-through",
    clientBillable: false,
    notes: "Transaction fees are percentage-based and scale with sales volume — not a fixed recurring cost, so it is excluded from the recurring total. Track separately once real volume exists.",
  },
  {
    id: "infra-storage",
    provider: "Object storage",
    service: "Storage",
    plan: "Standard",
    providerPrice: 5,
    currency: "USD",
    billing: "monthly",
    source: "PLACEHOLDER — verify against actual storage provider used",
    lastVerified: "2026-08-12",
    costTreatment: "bundled",
    clientBillable: false,
    notes: "Bundled into the maintenance package by default rather than billed separately.",
  },
  {
    id: "infra-monitoring",
    provider: "Uptime/monitoring",
    service: "Monitoring",
    plan: "Basic",
    providerPrice: 0,
    currency: "USD",
    billing: "monthly",
    source: "PLACEHOLDER — many monitoring tools have a usable free tier",
    lastVerified: "2026-08-12",
    costTreatment: "absorbed",
    clientBillable: false,
  },
];

export function getInfrastructureItemById(
  id: string
): InfrastructureItem | undefined {
  return infrastructureCatalogue.find((i) => i.id === id);
}
