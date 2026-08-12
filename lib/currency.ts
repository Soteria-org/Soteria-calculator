// Small, boring currency helpers. FX rates are always manual config
// (config/pricing-rules.ts `rates`) — never fetched live. See
// docs/pricing-model.md §Currency for why.

import { FxRate, SupportedCurrency } from "./types";

/** Converts an amount in `currencyCode` to UGX using the supplied rate table. */
export function convertToUgx(
  amount: number,
  currencyCode: SupportedCurrency,
  rates: FxRate[]
): number {
  if (currencyCode === "UGX") return amount;

  const rate = rates.find((r) => r.code === currencyCode);
  if (!rate) {
    throw new Error(`No FX rate configured for currency "${currencyCode}"`);
  }
  return amount * rate.ugxPerUnit;
}
