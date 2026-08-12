# Roadmap

V1 (this build) is deliberately small: a config-driven pricing engine and a
form that shows its work, with no persistence beyond the current browser
session. Everything below is intentionally **not** built yet — sequencing
matters, and building these before the calculator itself was solid would
have been the wrong order.

## Day 2 — make an estimate into a business record

- Clients and projects register (persisted, not just in-session state).
- Quotes: save an estimate, give it a status (draft/sent/accepted/expired).
- Invoices generated from an accepted quote's deposit/balance.
- Payments recorded against an invoice; receipts generated.
- Change requests: track scope added after the original quote, priced using
  the same engine.
- A basic financial ledger tying quotes → invoices → payments together.
- Exports (PDF/CSV) of quotes and invoices.

## Day 3 — operate on the data Day 2 produced

- Dashboard: pipeline of quotes/projects by status.
- Project profitability: actual hours/cost logged against the original
  estimate.
- Estimate-vs-actual reporting, feeding back into
  `config/development-pricing.ts` (see `docs/pricing-model.md` §8).
- Renewal tracking for recurring infrastructure/maintenance line items.
- Presets/templates for common project shapes, built from real historical
  quotes rather than guessed.

## Explicitly out of scope, indefinitely

- AI-generated pricing or scope suggestions. This tool's entire premise is
  that pricing is a deliberate, traceable business rule set — not a model
  guess.
- Becoming a general-purpose ERP. If a Day 2/3 feature above starts pulling
  this project toward invoicing-for-any-business rather than
  Soteria-specific estimation, that's a signal to stop and reconsider, not
  a signal to keep building.
