# Pricing model — the *why* behind the numbers

This is the source of truth for why the calculator computes what it
computes. `config/` holds the *values*; this document holds the *reasoning*.
If you change a business rule, update this file in the same change.

## 1. Calculation order

`lib/calculator-engine.ts` (`calculateEstimate`) runs the steps in this
order, and the order matters:

1. **Resolve scope.** Every feature marked `required: true` in
   `config/development-pricing.ts` (currently just the base system) is
   included regardless of what the user selected, unioned with the
   explicitly selected feature ids. No double counting.
2. **Subtotal.** Sum `hours` and `basePrice` across the resolved features.
   `basePrice` already assumes *standard* project complexity.
3. **Complexity adjustment.** The project-level `complexityLevel` looks up a
   multiplier in `pricingRules.complexityMultipliers` and is applied to the
   *whole* subtotal — not per feature. This is deliberate: complexity is a
   property of the project (unclear requirements, integration risk), not of
   any single line item.
4. **Contingency.** A flat `contingencyPercent` on top of the
   post-complexity figure. This is buffer for the unknown unknowns that
   complexity doesn't already capture — scope creep, revision cycles.
5. **Rounding.** The recommended price is rounded to the nearest
   `roundingIncrementUgx` so quotes don't end in odd numbers.
6. **Lean / Premium.** Derived from the recommended price via
   `leanMultiplier` / `premiumMultiplier` — they are *not* separately
   recomputed from a different feature set. They exist so a client can see
   the trade space without Soteria re-doing the whole calculation.
7. **Deposit / balance.** `defaultDepositPercent` of each scenario's price,
   floored at `minimumDepositUgx` (so a very small project still covers
   Soteria's minimum admin overhead of starting it), capped at the price
   itself.

## 2. Internal cost & margin (internal view only)

`internalCostUgx = estimatedHours × internalHourlyCostUgx`. This is Soteria's
own delivery cost estimate, entirely separate from what's charged. It exists
purely as a sanity check — `marginCheckPercent` shows whether the
recommended price still clears a sane margin once a project's scope grows
past what the base per-feature pricing assumed. It is **never** shown in
client view.

## 3. Infrastructure recurring cost

Each `InfrastructureItem` separates four things that must never be
collapsed into one number:

- `providerPrice` / `currency` — what the provider actually charges Soteria.
- `costTreatment` — Soteria's commercial decision:
  - `pass-through` — billed to the client at cost, no markup.
  - `administered` — provider cost **plus** `adminFeeUgx`, because Soteria
    is managing the account/renewal/support burden.
  - `absorbed` — Soteria eats the cost; it never reaches the client.
  - `bundled` — folded into a maintenance package rather than billed as its
    own line.
- `clientBillable` — whether the item counts toward the client's recurring
  total at all. `absorbed` and `bundled` items are excluded even if they
  technically cost something.
- `billing` — `monthly`, `annual`, or `one-time`. One-time/per-unit costs
  (e.g. SMS credits, priced per message) are excluded from both the monthly
  and annual recurring totals — they scale with usage the calculator
  doesn't track yet, so showing a made-up recurring figure would be worse
  than showing nothing.

`infrastructureMonthlyUgx` sums billable `monthly` items (provider cost,
converted to UGX, plus admin fee where administered).
`infrastructureAnnualUgx` is that monthly total × 12, plus any billable
`annual` items added on top.

## 4. Maintenance

Priced as `percentOfDevelopmentPrice` of the *recommended* development
price, floored at `minimumMonthlyUgx`. The floor exists so a small project
doesn't produce a maintenance fee too low to actually cover checking on it
once a month.

## 5. Currency

FX rates (`pricingRules.rates`) are **manual, not fetched live**. A
calculator that silently repriced itself because an exchange rate moved
overnight would undermine the "no AI guessing, no hidden movement" premise
of this tool. Update `ugxPerUnit` by hand when a rate materially changes,
and update `lastVerified` when you do.

## 6. Client view vs. internal view

`view === "client"` must never render: `internalCostUgx`,
`marginCheckPercent`, hours (`estimatedHours` / per-line `hours`), or any
gross-margin figure. This is enforced at the component level
(`components/PricingBreakdown.tsx`, `components/EstimateSummary.tsx`) — if
you add a new internal-only number, gate it the same way, don't add a
separate "hide before printing" step that's easy to forget.

## 7. Placeholder data

Everything in `config/` is a starting default, not confirmed Soteria
policy or verified provider pricing — see the `PLACEHOLDER` markers in
`config/infrastructure-pricing.ts` and the note at the top of
`config/pricing-rules.ts`. Do not quote a real client from unverified
figures.

## 8. Pricing intelligence (future)

Once a handful of real projects have logged actual hours against their
estimated hours, `config/development-pricing.ts` should be revised using
that evidence instead of the initial estimates. This calculator doesn't
capture actuals yet — see `docs/roadmap.md`.
