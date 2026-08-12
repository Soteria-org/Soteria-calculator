"use client";

import { formatUgx } from "@/lib/format";
import { EstimateConfidence, EstimateResult, ProjectInput } from "@/lib/types";

interface EstimateSummaryProps {
  input: ProjectInput;
  result: EstimateResult;
  view: "internal" | "client";
  onViewChange: (view: "internal" | "client") => void;
}

const confidenceStyles: Record<EstimateConfidence, string> = {
  high: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-300 print:border-emerald-300 print:bg-emerald-50 print:text-emerald-700",
  medium:
    "border-soteria-gold/40 bg-soteria-goldSoft text-soteria-gold print:border-amber-300 print:bg-amber-50 print:text-amber-700",
  low: "border-soteria-warn/40 bg-soteria-warnSoft text-soteria-warn print:border-rose-300 print:bg-rose-50 print:text-rose-700",
};

export function EstimateSummary({
  input,
  result,
  view,
  onViewChange,
}: EstimateSummaryProps) {
  const recommended = result.scenarios.find((s) => s.scenario === "recommended")!;

  return (
    <section className="card p-5 print:border-slate-200 print:bg-white" id="estimate-summary">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-soteria-faint print:text-slate-400">
            Project estimate
          </p>
          <h2 className="text-lg font-bold text-soteria-ink print:text-slate-900">
            {input.projectName || "Untitled project"}
          </h2>
          <p className="text-sm text-soteria-muted print:text-slate-500">
            {input.clientName || "Client not named"}
            {input.projectType ? ` · ${input.projectType}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`chip border ${confidenceStyles[input.confidence]}`}>
            Confidence: {input.confidence}
          </span>
          <div className="flex rounded-md border border-soteria-borderStrong text-xs print:hidden">
            <button
              type="button"
              onClick={() => onViewChange("internal")}
              className={`rounded-l-md px-3 py-1.5 transition-colors ${
                view === "internal"
                  ? "bg-soteria-navy text-white"
                  : "bg-transparent text-soteria-muted hover:text-soteria-ink"
              }`}
            >
              Internal
            </button>
            <button
              type="button"
              onClick={() => onViewChange("client")}
              className={`rounded-r-md px-3 py-1.5 transition-colors ${
                view === "client"
                  ? "bg-soteria-navy text-white"
                  : "bg-transparent text-soteria-muted hover:text-soteria-ink"
              }`}
            >
              Client view
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          label="Recommended development price"
          value={formatUgx(recommended.developmentPriceUgx)}
          emphasis
        />
        <SummaryTile
          label="Recommended deposit"
          value={formatUgx(recommended.depositUgx)}
        />
        <SummaryTile
          label="Balance on completion"
          value={formatUgx(recommended.balanceUgx)}
        />
        <SummaryTile
          label="Estimated timeline"
          value={`${result.estimatedWeeksMin}–${result.estimatedWeeksMax} weeks`}
        />
        <SummaryTile
          label="Estimated recurring infrastructure"
          value={
            result.infrastructureMonthlyUgx > 0
              ? `${formatUgx(result.infrastructureMonthlyUgx)}/mo`
              : "—"
          }
        />
        <SummaryTile
          label="Infrastructure (annual)"
          value={
            result.infrastructureAnnualUgx > 0
              ? `${formatUgx(result.infrastructureAnnualUgx)}/yr`
              : "—"
          }
        />
        <SummaryTile
          label="Optional maintenance"
          value={
            result.maintenanceMonthlyUgx
              ? `${formatUgx(result.maintenanceMonthlyUgx)}/mo`
              : "Not selected"
          }
        />
        {view === "internal" && (
          <SummaryTile
            label="Internal cost"
            value={formatUgx(result.internalCostUgx)}
            warn
          />
        )}
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-soteria-border text-left text-xs uppercase tracking-wide text-soteria-muted print:border-slate-200 print:text-slate-500">
              <th className="py-2">Scenario</th>
              <th className="py-2 text-right">Development price</th>
              <th className="py-2 text-right">Deposit</th>
              <th className="py-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {result.scenarios.map((s) => (
              <tr
                key={s.scenario}
                className={`border-b border-soteria-border print:border-slate-100 ${
                  s.scenario === "recommended"
                    ? "bg-soteria-tealSoft print:bg-slate-50"
                    : ""
                }`}
              >
                <td className="py-2 font-medium text-soteria-ink print:text-slate-800">
                  {s.label}
                </td>
                <td className="py-2 text-right text-soteria-body print:text-slate-700">
                  {formatUgx(s.developmentPriceUgx)}
                </td>
                <td className="py-2 text-right text-soteria-body print:text-slate-700">
                  {formatUgx(s.depositUgx)}
                </td>
                <td className="py-2 text-right text-soteria-body print:text-slate-700">
                  {formatUgx(s.balanceUgx)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(input.assumptions.length > 0 || input.risks.length > 0) && (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {input.assumptions.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-soteria-muted print:text-slate-500">
                Assumptions
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-soteria-body print:text-slate-600">
                {input.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {input.risks.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-soteria-muted print:text-slate-500">
                Risks
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-soteria-body print:text-slate-600">
                {input.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SummaryTile({
  label,
  value,
  emphasis,
  warn,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-3 ${
        warn
          ? "border-soteria-warn/40 bg-soteria-warnSoft print:border-rose-200 print:bg-rose-50"
          : emphasis
          ? "border-soteria-gold/40 bg-soteria-goldSoft print:border-amber-200 print:bg-amber-50"
          : "border-soteria-border bg-soteria-surfaceHover print:border-slate-200 print:bg-slate-50"
      }`}
    >
      <p className="text-xs text-soteria-muted print:text-slate-500">{label}</p>
      <p
        className={`mt-0.5 font-semibold ${
          emphasis
            ? "text-lg text-soteria-gold print:text-amber-700"
            : "text-soteria-ink print:text-slate-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
