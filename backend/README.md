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
`config.php` assumes out of the box. If you changed that, override it —
copy `config.local.php.example` to `config.local.php` in this folder and
fill in your values. `config.local.php` is gitignored, so real credentials
never get committed; `config.php` loads it automatically if present.

## Hosting on InfinityFree

[InfinityFree](https://infinityfree.com) gives you free PHP + MySQL
hosting with no SSH/git access — only FTP and a web control panel
(vPanel). That shapes how deployment has to work here: there's no way to
`git pull` on the server, so **the repo and the live site only stay in
sync if something pushes files to InfinityFree on your behalf.**
`.github/workflows/deploy-backend.yml` is that something — it FTPs the
current `backend/` to InfinityFree every time it changes on `main`, so
you never hand-edit files over FTP and let them drift from the repo.

**One-time setup:**

1. Sign up at InfinityFree and create an account (a free `*.infinityfreeapp.com`
   subdomain, or point your own domain at it).
2. **Enable HTTPS** on that domain from vPanel (free, via Let's Encrypt —
   can take a few hours to provision). This isn't optional: the frontend
   is served over HTTPS on Vercel, and browsers block a page from calling
   a plain `http://` API from an `https://` page (mixed content). If the
   API isn't on HTTPS yet, nothing will work until it is.
3. In vPanel, create a MySQL database. InfinityFree auto-prefixes the
   database and username with your account ID (e.g. `if0_12345678_soteria_calculator`
   / `if0_12345678`) — note the exact host, database name, username, and
   password it shows you.
4. Open phpMyAdmin from vPanel, select that database, and import
   `schema.sql` (Import tab → choose file → Go).
5. In vPanel's FTP Accounts section, note the FTP host, username, and
   password. Decide where `backend/` should live under `htdocs/` — e.g.
   `/htdocs/soteria-api/` — and create that folder if it doesn't exist.
6. In this GitHub repo, go to **Settings → Secrets and variables →
   Actions** and add:
   - `INFINITYFREE_FTP_HOST`, `INFINITYFREE_FTP_USERNAME`,
     `INFINITYFREE_FTP_PASSWORD`, `INFINITYFREE_FTP_SERVER_DIR`
     (e.g. `/htdocs/soteria-api/`)
   - `INFINITYFREE_DB_HOST`, `INFINITYFREE_DB_NAME`,
     `INFINITYFREE_DB_USER`, `INFINITYFREE_DB_PASS` (from step 3)
   - Optionally `INFINITYFREE_ALLOWED_ORIGIN` — your deployed frontend's
     exact URL, so the API only answers CORS preflight for that origin
     instead of `*`
7. Push to `main` (or run the workflow manually from the Actions tab —
   "Deploy backend to InfinityFree" → Run workflow). The workflow
   generates `backend/config.local.php` from the DB secrets above and
   FTPs the whole `backend/` folder over.
8. Confirm it's live: visit
   `https://your-domain/soteria-api/clients.php` — you should see
   `{"clients":[]}`.
9. On Vercel, set the project's `NEXT_PUBLIC_API_BASE_URL` environment
   variable to that same base URL and redeploy the frontend.

**What this doesn't do yet:** there is no authentication on any of these
endpoints — anyone who knows the API's URL can read and write records.
That's an acceptable gap while the URL is unpublished and only your team
knows it, but revisit before relying on this for anything sensitive.
InfinityFree's free tier is also best-effort: expect occasional slowness
or downtime, and (rarely) an anti-bot interstitial on requests that don't
look like a normal browser. Fine for testing and internal use; if this
becomes load-bearing, budget for real hosting.

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
