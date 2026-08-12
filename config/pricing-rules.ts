// Soteria's commercial policy. Every number here is a business decision,
// not a technical constant — change it here, not inside components or the
// calculator engine. See docs/pricing-model.md for the reasoning behind
// each figure.
//
// PLACEHOLDER VALUES: the figures below are sensible starting defaults, not
// confirmed Soteria policy. Review with leadership before quoting a real
// client from this config.

import { PricingRules } from "@/lib/types";

export const pricingRules: PricingRules = {
  defaultMarginPercent: 45,
  defaultDepositPercent: 50,
  minimumDepositUgx: 200_000,
  contingencyPercent: 8,
  internalHourlyCostUgx: 18_000,
  roundingIncrementUgx: 500,
  leanMultiplier: 0.9,
  premiumMultiplier: 1.2,

  // Preserved from the V3 calculation engine: complexity scales estimated
  // hours and, through them, price. Do not silently change these without
  // updating docs/pricing-model.md and re-checking recent quotes.
  complexityMultipliers: [
    {
      level: "lean",
      label: "Lean / familiar",
      multiplier: 0.85,
      description:
        "Soteria has built this before, requirements are clear, low integration risk.",
    },
    {
      level: "standard",
      label: "Standard",
      multiplier: 1.0,
      description: "Typical project. Some unknowns, manageable scope.",
    },
    {
      level: "complex",
      label: "Complex / integrations",
      multiplier: 1.25,
      description:
        "Multiple integrations, non-trivial business logic, or dependencies on third parties Soteria doesn't control.",
    },
    {
      level: "high-uncertainty",
      label: "High uncertainty",
      multiplier: 1.5,
      description:
        "Requirements are still moving, or this is a technology/domain Soteria hasn't shipped before.",
    },
  ],

  durationBands: [
    {
      level: "lean",
      label: "Simple",
      minWeeks: 1,
      maxWeeks: 2,
      note: "Small, well-understood scope.",
    },
    {
      level: "standard",
      label: "Moderate",
      minWeeks: 3,
      maxWeeks: 5,
      note: "Standard business build.",
    },
    {
      level: "complex",
      label: "Complex",
      minWeeks: 6,
      maxWeeks: 10,
      note: "Multiple systems/integrations.",
    },
    {
      level: "high-uncertainty",
      label: "Enterprise / custom",
      minWeeks: 10,
      maxWeeks: 16,
      note: "Treat as a custom assessment — this band is a placeholder, not a promise.",
    },
  ],

  baseCurrency: "UGX",

  // Manual FX only. Never fetched live — see docs/pricing-model.md §Currency.
  rates: [
    {
      code: "USD",
      ugxPerUnit: 3700,
      source: "Manual entry — confirm against bank/market rate before use",
      lastVerified: "2026-08-12",
    },
    {
      code: "EUR",
      ugxPerUnit: 4000,
      source: "Manual entry — confirm against bank/market rate before use",
      lastVerified: "2026-08-12",
    },
    {
      code: "GBP",
      ugxPerUnit: 4650,
      source: "Manual entry — confirm against bank/market rate before use",
      lastVerified: "2026-08-12",
    },
  ],
};
