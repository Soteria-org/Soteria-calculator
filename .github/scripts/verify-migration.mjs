// Runs migrate.php and then clients.php through a real headless browser,
// not curl. InfinityFree serves a JS anti-bot interstitial to some
// requests — notably ones from datacenter IPs like GitHub Actions runners
// — instead of the real PHP response: it sets a cookie via a small inline
// script and does a client-side `location.href` redirect back to the same
// URL. A real browser clears that automatically because it executes the
// script; curl can't, so a `curl` + `HTTP 200` check can (and did) report
// success while the response body was that interstitial page, not JSON —
// meaning the migration silently never ran. This script actually parses
// the final response as JSON and fails loudly if it isn't.
import { chromium } from "playwright";

const apiUrl = process.env.API_URL;
const token = process.env.TOKEN;

if (!apiUrl || !token) {
  console.log("INFINITYFREE_API_URL or INFINITYFREE_MIGRATION_TOKEN not set — skipping migration.");
  process.exit(0);
}

const base = apiUrl.replace(/\/$/, "");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Returns { ok, detail } instead of throwing, so one endpoint's failure
// doesn't hide what happened with the others — every run should report on
// migrate.php AND clients.php, not stop at the first problem.
async function loadJson(browser, url, label) {
  const page = await browser.newPage({ userAgent: UA });
  await page.goto(url, { waitUntil: "load", timeout: 45000 }).catch((e) => {
    console.log(`[${label}] initial navigation warning: ${e.message}`);
  });
  // Give a possible challenge-script redirect time to complete.
  await page.waitForLoadState("networkidle", { timeout: 45000 }).catch(() => {});
  const finalUrl = page.url();
  const text = (await page.evaluate(() => document.body?.innerText ?? "")).trim();
  await page.close();

  console.log(`[${label}] final URL: ${finalUrl}`);
  console.log(`[${label}] response: ${text.slice(0, 800)}`);

  try {
    return { ok: true, json: JSON.parse(text) };
  } catch {
    const looksLikeChallenge = text.includes("slowAES") || text.includes("toNumbers(");
    const looksLikeInfinityFree404 = finalUrl.includes("errors.infinityfree.net");
    const reason = looksLikeChallenge
      ? "InfinityFree's anti-bot JS challenge page"
      : looksLikeInfinityFree404
        ? "InfinityFree's own 404/account-not-found page (not the app — the request never reached migrate.php/clients.php at all)"
        : "unexpected non-JSON content";
    console.log(`[${label}] FAILED — got ${reason} instead of JSON.`);
    return { ok: false, reason };
  }
}

const browser = await chromium.launch();
let anyFailed = false;
try {
  const migrateUrl = `${base}/migrate.php?token=${encodeURIComponent(token)}`;
  const migrateResult = await loadJson(browser, migrateUrl, "migrate.php");
  if (migrateResult.ok) {
    console.log("migrate.php result:", JSON.stringify(migrateResult.json));
  } else {
    anyFailed = true;
  }

  const clientsResult = await loadJson(browser, `${base}/clients.php`, "clients.php");
  if (clientsResult.ok) {
    console.log("clients.php result:", JSON.stringify(clientsResult.json));
    if (!("clients" in clientsResult.json)) {
      console.log(`clients.php responded but without a "clients" key.`);
      anyFailed = true;
    }
  } else {
    anyFailed = true;
  }
} finally {
  await browser.close();
}

if (anyFailed) {
  console.log(
    "\nOne or more endpoints didn't return real JSON. If it was the anti-bot challenge page, " +
      "try opening the URL manually in a normal browser once (solves it for ~6h) or check vPanel " +
      "for a bot-protection setting. If it was InfinityFree's own 404 page, the request never " +
      "reached the app at all — double-check INFINITYFREE_API_URL matches where the FTP deploy " +
      "actually puts files, and that the domain/hosting account is active (not suspended)."
  );
  process.exit(1);
}
