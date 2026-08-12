# Soteria Calculator

An internal Soteria tool for turning a client conversation into a defensible
price — transparently, in about 5–10 minutes, with no AI guessing and no
mental arithmetic.

This is **not** an AI pricing tool, **not** an ERP, and **not** meant to grow
into either. It is deliberately small: config-driven pricing rules, a pure
calculation engine, and a form that shows its work.

## What V1 does

1. Capture the client/project brief and an honest confidence level.
2. Select the scope from Soteria's service catalogue (grouped by category,
   not "number of pages").
3. Select the infrastructure/tools this project needs, each with its
   provider price, source, and last-verified date.
4. Optionally attach a maintenance package.
5. See the full breakdown — every line item, the complexity adjustment, the
   contingency, and the resulting **Lean / Recommended / Premium** prices —
   plus the deposit, balance, and an estimated timeline.
6. Switch to **Client view** before printing/sharing a quote: internal cost,
   margin, and hourly rate never render in that mode. That's a hard rule, not
   a style choice — see `docs/pricing-model.md`.
7. Optionally **save a quote** against a client/project, then track it through
   an **invoice** (deposit/balance/full/maintenance/custom), record **partial
   payments** with what each one covers, and get an auto-issued **receipt**
   per payment — plus a one-click **download of a project's full record**
   (every quote, invoice, payment, and receipt) as JSON. See `backend/`.

## What V1 deliberately does not do yet

Change requests, a financial ledger, project profitability/estimate-vs-actual
reporting, renewal tracking, and presets/templates — the Day 3 layer
described in `docs/roadmap.md`. The calculator itself still requires no setup
to use; saving records is opt-in and needs the separate backend below.

## Project structure

```
app/                  Next.js routes (App Router)
  page.tsx            Landing page
  calculator/page.tsx The calculator itself — one page, live-updating
  projects/            Saved projects: list, detail, printable invoices/receipts
components/           UI only. No pricing math lives here.
config/               Soteria's pricing policy, as data, not code.
  pricing-rules.ts        margin, deposit, contingency, complexity multipliers, FX rates
  development-pricing.ts  the feature/service catalogue
  infrastructure-pricing.ts the tool/provider catalogue
  maintenance-pricing.ts  optional maintenance packages
lib/
  calculator-engine.ts     the ONLY place price gets computed
  calculator-engine.test.ts automated tests for the math above
  types.ts                 shared vocabulary between config, engine, and UI
  currency.ts, format.ts   small, boring helpers
  records-types.ts, api-client.ts  shapes and client for the records backend
backend/               Separate PHP + MySQL API: quotes, invoices, payments,
                       receipts. Dumb storage only — see backend/README.md
docs/                  Source of truth for *why*, not just *what*
```

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # calculation engine tests (vitest)
npm run build    # production build / type check
```

The calculator itself needs no database, environment variables, or backend.

**Saving quotes, invoices, payments, and receipts** needs the separate PHP +
MySQL API in `backend/` running (e.g. under XAMPP — see `backend/README.md`)
and `NEXT_PUBLIC_API_BASE_URL` set (copy `.env.local.example` to
`.env.local`). Without it, `/projects` shows a clear "not configured"
message and the calculator itself is unaffected.

## Editing the pricing rules

Never hardcode a price in a component. Everything commercial lives in
`config/`:

- Change a feature's price or hours → `config/development-pricing.ts`
- Change margin, deposit %, contingency, complexity multipliers, or FX rates
  → `config/pricing-rules.ts`
- Change a provider's price, or how much of it gets passed to the client →
  `config/infrastructure-pricing.ts`
- Change maintenance package pricing → `config/maintenance-pricing.ts`

Every change to a business rule should also update `docs/pricing-model.md` so
six months from now someone can tell you *why* a number is what it is.

## Placeholder data — read before quoting a real client

- **No seeded clients or projects.** This build intentionally starts blank —
  you enter real data as real conversations happen.
- **The infrastructure catalogue prices are placeholders.** They demonstrate
  the shape of the data (provider cost → cost treatment → client charge),
  not confirmed current pricing. Each entry is flagged `PLACEHOLDER` in its
  `source` field until someone checks it against the provider and updates
  `lastVerified`.
- **The feature catalogue's hours/prices are starting estimates**, not yet
  backed by logged Soteria project data. Once a few real projects log actual
  hours, replace these with evidence — see `docs/pricing-model.md`.
- **Margin, deposit, and contingency percentages are defaults**, not
  confirmed Soteria policy — review with leadership.

## Next (see docs/roadmap.md)

Day 3: dashboard, project profitability, estimate-vs-actual, renewal
tracking, presets/templates. Change requests and a proper financial ledger
are the remaining Day 2 pieces.
