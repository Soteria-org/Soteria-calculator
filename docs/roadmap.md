# Roadmap

V1 was deliberately small: a config-driven pricing engine and a form that
shows its work, with no persistence beyond the browser session. Most of
Day 2 below has since been built — a separate PHP + MySQL API
(`backend/`) now gives clients/projects/quotes/invoices/payments/receipts
real, cross-session storage. Sequencing still mattered: building this
before the calculator itself was solid would have been the wrong order.

## Day 2 — make an estimate into a business record

- [x] Clients and projects register (persisted in `backend/`, not just
  in-session state).
- [x] Quotes: save an estimate, give it a status
  (draft/sent/accepted/expired).
- [x] Invoices generated from a quote's deposit/balance/full price (or a
  custom amount) — see `components` under `app/projects/[id]/`.
- [x] Payments recorded against an invoice, each noting what it covers
  (important for partials); receipts auto-issued per payment.
- [x] Per-project export: every quote/invoice/payment/receipt for a
  project as one downloadable JSON file (`backend/export.php`).
- [ ] Change requests: track scope added after the original quote, priced
  using the same engine.
- [ ] A proper financial ledger tying quotes → invoices → payments
  together across *all* projects (today's view is per-project only).
- [ ] PDF export as an actual file (today's "PDF" is the browser's
  Print dialog against a print-tuned stylesheet — good enough for V1,
  but not a server-generated PDF).

## Day 3 — operate on the data Day 2 produced

- Dashboard: pipeline of quotes/projects by status, revenue/outstanding
  totals across all clients (today's `/projects` is a flat list).
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
