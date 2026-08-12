# Backend — records API (PHP + MySQL)

This is the persistence layer for saved quotes, invoices, payments, and
receipts — the "Day 2" layer described in `../docs/roadmap.md`. It is
**not** where prices get computed. `lib/calculator-engine.ts` in the
Next.js app is still the only place that happens; this API only stores
the frozen snapshot it's given and does simple bookkeeping (invoice
status, sequential invoice/receipt numbers) on top.

The Next.js frontend (deployed separately, e.g. on Vercel) calls this API
over HTTP. They are two codebases in one repo, not one app.

## Setup with XAMPP

1. Install [XAMPP](https://www.apachefriends.org/) and start **Apache**
   and **MySQL** from the control panel.
2. Copy this `backend/` folder into your XAMPP `htdocs` directory, e.g.
   `C:\xampp\htdocs\soteria-api\` (Windows) or
   `/Applications/XAMPP/htdocs/soteria-api/` (Mac).
3. Open [phpMyAdmin](http://localhost/phpmyadmin), create a database
   named `soteria_calculator`, select it, and import `schema.sql`
   (Import tab → choose file → Go).
4. Confirm the API is up: visit
   `http://localhost/soteria-api/clients.php` — you should see
   `{"clients":[]}`.
5. In the Next.js app, set:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost/soteria-api
   ```
   in `.env.local` (see `.env.local.example` at the repo root).

XAMPP's default MySQL user is `root` with no password, which is what
`config.php` assumes out of the box. If you changed that, override it
with environment variables instead of editing `config.php`:

```
SOTERIA_DB_HOST=127.0.0.1
SOTERIA_DB_NAME=soteria_calculator
SOTERIA_DB_USER=root
SOTERIA_DB_PASS=your_password
```

(How to set these for Apache/PHP under XAMPP depends on your OS — the
simplest path is `SetEnv` directives in an `.htaccess` file inside this
folder, or editing `php.ini`'s `variables_order`/using `putenv()` in a
`prepend.php` you configure XAMPP to auto-include.)

## Endpoints

All responses are JSON. All money fields are UGX, matching the frontend.

| Method | Path | Purpose |
|---|---|---|
| GET | `clients.php` | List clients |
| POST | `clients.php` | Create a client |
| GET | `projects.php` | List projects (dashboard view) |
| GET | `projects.php?id=` | One project: client, all quotes, all invoices with their payments |
| POST | `projects.php` | Create a project under an existing client |
| POST | `quotes.php` | Save a quote — finds-or-creates the client/project by name if ids aren't given |
| PATCH | `quotes.php?id=` | Update a quote's status (`draft`/`sent`/`accepted`/`expired`) |
| GET | `invoices.php?project_id=` | List a project's invoices |
| POST | `invoices.php` | Create an invoice (`deposit`/`balance`/`full`/`maintenance`/`custom`) |
| GET | `payments.php?invoice_id=` | List an invoice's payments |
| POST | `payments.php` | Record a payment — auto-issues a receipt and rolls the invoice's status forward |
| GET | `receipts.php?id=` | Fetch one receipt with its payment/invoice/project/client context, for printing |
| GET | `export.php?id=` | Download a project's full record (quotes, invoices, payments, receipts) as one JSON file |

## Why invoice status is never trusted from the client

`invoices.status` (`unpaid`/`partial`/`paid`/`void`) is recomputed by
`payments.php` from the sum of that invoice's payments every time a
payment is recorded — it is never accepted as input. That's what makes
partial payments safe to record in any order and any number of times
without the status silently drifting from reality.

## Local development without XAMPP

Any PHP 8+ with the `pdo_mysql` extension and a MySQL/MariaDB server
works the same way. For example:

```
php -S 127.0.0.1:8123 -t backend/
```

then point `NEXT_PUBLIC_API_BASE_URL` at `http://127.0.0.1:8123`.
