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
   password it shows you. This step only creates the empty database —
   the tables come later, from `migrate.php` (step 7), not phpMyAdmin.
4. Generate a random migration token — anything long and unguessable,
   e.g. `openssl rand -hex 20` in a terminal. This gates `migrate.php`
   (the endpoint that creates/updates tables on the live database) so it
   isn't reachable by anyone who finds the URL.
5. In vPanel's FTP Accounts section, get FTP credentials and figure out
   `INFINITYFREE_FTP_SERVER_DIR`. **InfinityFree's FTP is not chrooted**
   — the working directory you land in after connecting is a real
   absolute filesystem path, something like
   `/home/vol14_3/infinityfree.com/if0_12345678`, not a virtualized `/`.
   That path is your account's home directory, one level *above* the web
   root — the publicly-served files live in `htdocs` underneath it. So
   `INFINITYFREE_FTP_SERVER_DIR` needs the **full absolute path down into
   where the API should live**, e.g.:
   ```
   /home/vol14_3/infinityfree.com/if0_12345678/htdocs/soteria-api/
   ```
   Get your exact prefix by connecting with an FTP client (FileZilla) and
   reading the path shown after login, or from vPanel's FTP Accounts
   page. Create the `soteria-api` folder under `htdocs` if it isn't there
   yet. (If you instead create a **scoped "additional FTP account"** tied
   to that folder specifically, its home directory is that exact path
   already, and `INFINITYFREE_FTP_SERVER_DIR` can just be `.` or `/`.)
6. In this GitHub repo, go to **Settings → Secrets and variables →
   Actions** and add:
   - `INFINITYFREE_FTP_HOST`, `INFINITYFREE_FTP_USERNAME`,
     `INFINITYFREE_FTP_PASSWORD`, `INFINITYFREE_FTP_SERVER_DIR` (the full
     absolute path from step 5)
   - `INFINITYFREE_DB_HOST`, `INFINITYFREE_DB_NAME`,
     `INFINITYFREE_DB_USER`, `INFINITYFREE_DB_PASS` (from step 3)
   - `INFINITYFREE_MIGRATION_TOKEN` (from step 4)
   - `INFINITYFREE_API_URL` — the API's public base URL once step 2's
     HTTPS is live, e.g. `https://your-domain/soteria-api`. This is what
     lets the workflow call `migrate.php` for you; without it, the
     workflow still deploys the files but skips creating the tables, and
     you'd hit a "table doesn't exist" error until you run migrate.php
     yourself.
   - Optionally `INFINITYFREE_ALLOWED_ORIGIN` — your deployed frontend's
     exact URL, so the API only answers CORS preflight for that origin
     instead of `*`
7. Push to `main` (or run the workflow manually from the Actions tab —
   "Deploy backend to InfinityFree" → Run workflow). The workflow:
   generates `backend/config.local.php` from the secrets above, FTPs the
   whole `backend/` folder over, then calls `migrate.php` to create the
   six tables from `schema.sql`. Check the Actions tab for the run's
   output — the migrate step prints which tables were created.
8. Confirm it's live: visit
   `https://your-domain/soteria-api/clients.php` — you should see
   `{"clients":[]}`.
9. On Vercel, set the project's `NEXT_PUBLIC_API_BASE_URL` environment
   variable to that same base URL (without `/migrate.php` — just the
   base, e.g. `https://your-domain/soteria-api`) and redeploy the frontend.

**Re-running the migration by hand**, if you ever need to (e.g. you
edited `schema.sql` and want to apply it without a full deploy): visit
`https://your-domain/soteria-api/migrate.php?token=YOUR_TOKEN` directly,
or re-run the GitHub Actions workflow. It's always safe to run again —
every statement in `schema.sql` is `CREATE TABLE IF NOT EXISTS`, so an
already-migrated database is untouched.

**What this doesn't do yet:** there is no authentication on the CRUD
endpoints (`clients.php`, `projects.php`, etc.) — anyone who knows the
API's URL can read and write records. `migrate.php` is the one exception
(token-gated, since it runs schema changes rather than data changes).
The CRUD gap is acceptable while the URL is unpublished and only your
team knows it, but revisit before relying on this for anything sensitive.

**InfinityFree's anti-bot challenge (confirmed, not just "rare"):**
dispatching this workflow for real showed InfinityFree serving a
JavaScript challenge page — not the API — to requests from GitHub
Actions runner IPs. It responds with **HTTP 200**, so a plain
`curl ... && check status code` (what an earlier version of this
workflow did) reports success even though the body is an anti-bot
interstitial, not JSON, and the migration silently never ran. The
workflow's migrate step now drives a real headless browser (Playwright)
instead of curl specifically to get past this — the challenge is a small
inline script that sets a cookie and does a client-side redirect back to
the same URL, which a real browser executes automatically and curl
cannot. The step then parses the *final* response as JSON and fails
loudly if it isn't (see `.github/scripts/verify-migration.mjs`), so a
green run now means the migration actually ran, not just that something
answered on port 443.

This appears tied to the requester looking like a datacenter/script
client (GitHub Actions IPs in particular), not to the domain being
challenged universally — but that's inferred from one data point, not
verified across many requests or IP ranges. It has two implications
worth knowing about:
- If you ever see `migrate.php` or the CRUD endpoints return HTML instead
  of JSON when you test by hand, open the URL in a normal desktop browser
  once — that executes the challenge and should let requests through
  (from that IP) for the cookie's ~6 hour lifetime. If it keeps
  happening, check vPanel for a bot-protection / "under attack mode"
  setting to relax for this subdomain.
- The frontend calls this API with `fetch()` from the *browser*, not
  server-to-server, so real users' requests come from their own
  (typically residential) IPs, not a datacenter range — which is
  probably why this hasn't been reported as a problem in normal use.
  But it hasn't been specifically load-tested against the challenge
  either. If real users start seeing "records backend not configured"
  or fetch failures on `/projects` without changing anything on the
  frontend, this challenge is the first thing to check (view the network
  request in devtools — an HTML response instead of JSON is the tell).

InfinityFree's free tier is also best-effort beyond this: expect
occasional slowness or downtime. Fine for testing and internal use; if
this becomes load-bearing, budget for real hosting.

## Visibility into the database

Two options, depending on what you need:

- **Browse raw tables/rows** — InfinityFree's vPanel links to phpMyAdmin
  next to your database. That's the tool for "show me every row in
  `payments`," ad-hoc queries, or fixing a bad record by hand.
- **Browse it through the app** — `/projects` in the Next.js frontend
  already lists every saved project with its latest quote status, and
  each project's detail page shows its quotes, invoices, and payments in
  one place. `export.php?id=` downloads one project's complete record as
  JSON. There's no single view listing *all* clients or *all* payments
  across every project yet — that's the Day 3 dashboard in
  `../docs/roadmap.md`, not built yet.

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
| GET/POST | `migrate.php?token=` | Create/update tables from `schema.sql`. Requires `SOTERIA_MIGRATION_TOKEN`; safe to re-run |

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
