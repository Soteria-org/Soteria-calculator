// Small, boring display helpers. No pricing logic lives here — see
// lib/calculator-engine.ts for that.

export function formatUgx(amountUgx: number): string {
  const rounded = Math.round(amountUgx);
  return `UGX ${rounded.toLocaleString("en-UG")}`;
}

export function formatPercent(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(decimals)}%`;
}
