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
  console.log(`[${label}] response: ${text.slice(0, 500)}`);

  try {
    return JSON.parse(text);
  } catch {
    const looksLikeChallenge = text.includes("slowAES") || text.includes("toNumbers(");
    throw new Error(
      `[${label}] did not return JSON — got ${looksLikeChallenge ? "InfinityFree's anti-bot challenge page" : "unexpected non-JSON content"} instead. ` +
        `Try opening ${url} manually in a normal browser once (that solves the challenge for ~6h), or check vPanel for a way to relax bot protection for this subdomain.`
    );
  }
}

const browser = await chromium.launch();
try {
  const migrateUrl = `${base}/migrate.php?token=${encodeURIComponent(token)}`;
  const migrateResult = await loadJson(browser, migrateUrl, "migrate.php");
  console.log("migrate.php result:", JSON.stringify(migrateResult));

  const clientsResult = await loadJson(browser, `${base}/clients.php`, "clients.php");
  console.log("clients.php result:", JSON.stringify(clientsResult));
  if (!("clients" in clientsResult)) {
    throw new Error(`clients.php responded but without a "clients" key: ${JSON.stringify(clientsResult)}`);
  }
} finally {
  await browser.close();
}
