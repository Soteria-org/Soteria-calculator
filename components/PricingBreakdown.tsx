"use client";

import { formatPercent, formatUgx } from "@/lib/format";
import { EstimateResult } from "@/lib/types";

interface PricingBreakdownProps {
  result: EstimateResult;
  view: "internal" | "client";
}

/**
 * Renders the transparent line-item breakdown behind the recommended price.
 *
 * BOUNDARY: when view === "client", internal cost, margin, and hourly rate
 * must never render. This is not a styling choice — it's the product's
 * hard rule that internal commercial data never leaks into a client-facing
 * document. If you're extending this component, keep that branch clean.
 */
export function PricingBreakdown({ result, view }: PricingBreakdownProps) {
  return (
    <section className="card p-5 print:border-slate-200 print:bg-white">
      <h2 className="text-base font-semibold text-soteria-ink print:text-slate-900">
        How we got here
      </h2>
      <p className="field-hint mb-4 print:text-slate-500">
        {view === "client"
          ? "Development scope and price, item by item."
          : "Full internal breakdown, including cost and margin."}
      </p>

      <table className="w-full text-sm">
        <tbody>
          {result.lineItems.map((li) => (
            <tr
              key={li.id}
              className="border-b border-soteria-border print:border-slate-100"
            >
              <td className="py-1.5 text-soteria-body print:text-slate-700">
                {li.label}
              </td>
              {view === "internal" && (
                <td className="py-1.5 text-right text-xs text-soteria-faint print:text-slate-400">
                  {li.hours}h
                </td>
              )}
              <td className="py-1.5 text-right font-medium text-soteria-ink print:text-slate-800">
                {formatUgx(li.amountUgx)}
              </td>
            </tr>
          ))}
          <tr className="border-b border-soteria-border print:border-slate-100">
            <td
              className="py-1.5 text-soteria-muted print:text-slate-500"
              colSpan={view === "internal" ? 2 : 1}
            >
              Subtotal
            </td>
            <td className="py-1.5 text-right text-soteria-body print:text-slate-600">
              {formatUgx(result.subtotalUgx)}
            </td>
          </tr>
          <tr className="border-b border-soteria-border print:border-slate-100">
            <td
              className="py-1.5 text-soteria-muted print:text-slate-500"
              colSpan={view === "internal" ? 2 : 1}
            >
              Complexity adjustment
            </td>
            <td className="py-1.5 text-right text-soteria-body print:text-slate-600">
              {result.complexityAdjustmentUgx >= 0 ? "+" : ""}
              {formatUgx(result.complexityAdjustmentUgx)}
            </td>
          </tr>
          <tr className="border-b border-soteria-border print:border-slate-200">
            <td
              className="py-1.5 text-soteria-muted print:text-slate-500"
              colSpan={view === "internal" ? 2 : 1}
            >
              Contingency
            </td>
            <td className="py-1.5 text-right text-soteria-body print:text-slate-600">
              +{formatUgx(result.contingencyUgx)}
            </td>
          </tr>
          <tr>
            <td
              className="py-2 font-semibold text-soteria-ink print:text-slate-900"
              colSpan={view === "internal" ? 2 : 1}
            >
              Recommended development price
            </td>
            <td className="py-2 text-right text-lg font-bold text-soteria-gold print:text-amber-700">
              {formatUgx(result.recommendedPriceUgx)}
            </td>
          </tr>
        </tbody>
      </table>

      {view === "internal" && (
        <div className="mt-4 rounded-md border border-soteria-warn/40 bg-soteria-warnSoft p-3 text-sm print:border-rose-200 print:bg-rose-50">
          <p className="font-semibold text-soteria-warn print:text-rose-700">
            Internal only — never show to client
          </p>
          <div className="mt-1 grid grid-cols-2 gap-2 text-soteria-body sm:grid-cols-4 print:text-slate-700">
            <div>
              <p className="text-xs text-soteria-muted print:text-slate-500">
                Estimated hours
              </p>
              <p className="font-medium">{result.estimatedHours}h</p>
            </div>
            <div>
              <p className="text-xs text-soteria-muted print:text-slate-500">
                Internal cost
              </p>
              <p className="font-medium">{formatUgx(result.internalCostUgx)}</p>
            </div>
            <div>
              <p className="text-xs text-soteria-muted print:text-slate-500">Margin</p>
              <p className="font-medium">
                {formatPercent(result.marginCheckPercent, 1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-soteria-muted print:text-slate-500">
                Price vs. cost
              </p>
              <p className="font-medium">
                {formatUgx(result.recommendedPriceUgx - result.internalCostUgx)}{" "}
                gross
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
