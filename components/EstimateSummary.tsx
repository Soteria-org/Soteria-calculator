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
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-rose-50 text-rose-700 border-rose-200",
};

export function EstimateSummary({
  input,
  result,
  view,
  onViewChange,
}: EstimateSummaryProps) {
  const recommended = result.scenarios.find((s) => s.scenario === "recommended")!;

  return (
    <section className="card p-5" id="estimate-summary">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Project estimate
          </p>
          <h2 className="text-lg font-bold text-slate-900">
            {input.projectName || "Untitled project"}
          </h2>
          <p className="text-sm text-slate-500">
            {input.clientName || "Client not named"}
            {input.projectType ? ` · ${input.projectType}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`chip border ${confidenceStyles[input.confidence]}`}
          >
            Confidence: {input.confidence}
          </span>
          <div className="flex rounded-md border border-slate-300 text-xs">
            <button
              type="button"
              onClick={() => onViewChange("internal")}
              className={`px-3 py-1.5 rounded-l-md ${
                view === "internal"
                  ? "bg-soteria-ink text-white"
                  : "bg-white text-slate-600"
              }`}
            >
              Internal
            </button>
            <button
              type="button"
              onClick={() => onViewChange("client")}
              className={`px-3 py-1.5 rounded-r-md ${
                view === "client"
                  ? "bg-soteria-ink text-white"
                  : "bg-white text-slate-600"
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
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
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
                className={`border-b border-slate-100 ${
                  s.scenario === "recommended" ? "bg-soteria-accentSoft" : ""
                }`}
              >
                <td className="py-2 font-medium text-slate-800">{s.label}</td>
                <td className="py-2 text-right">
                  {formatUgx(s.developmentPriceUgx)}
                </td>
                <td className="py-2 text-right">{formatUgx(s.depositUgx)}</td>
                <td className="py-2 text-right">{formatUgx(s.balanceUgx)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(input.assumptions.length > 0 || input.risks.length > 0) && (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {input.assumptions.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Assumptions
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-slate-600">
                {input.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {input.risks.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Risks
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-slate-600">
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
          ? "border-soteria-warn/40 bg-soteria-warnSoft"
          : emphasis
          ? "border-soteria-accent bg-soteria-accentSoft"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-0.5 font-semibold ${
          emphasis ? "text-lg text-soteria-accent" : "text-slate-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
