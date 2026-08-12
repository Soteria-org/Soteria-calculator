"use client";

import { infrastructureCatalogue } from "@/config/infrastructure-pricing";
import { CostTreatment } from "@/lib/types";

interface InfrastructureSelectorProps {
  selectedIds: string[];
  onToggle: (id: string) => void;
}

const treatmentLabel: Record<CostTreatment, string> = {
  "pass-through": "Passed through at cost",
  administered: "Cost + admin fee",
  absorbed: "Absorbed by Soteria",
  bundled: "Bundled into maintenance",
};

export function InfrastructureSelector({
  selectedIds,
  onToggle,
}: InfrastructureSelectorProps) {
  const selected = new Set(selectedIds);

  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold text-slate-900">
        3. Infrastructure
      </h2>
      <p className="field-hint mb-4">
        Recurring costs are separate from development revenue. Every price
        here shows its source and when it was last checked — treat anything
        marked PLACEHOLDER as unverified until someone confirms it against the
        provider's current pricing.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="py-2 pr-3"></th>
              <th className="py-2 pr-3">Service</th>
              <th className="py-2 pr-3">Provider price</th>
              <th className="py-2 pr-3">Billing</th>
              <th className="py-2 pr-3">Client treatment</th>
              <th className="py-2 pr-3">Source / last verified</th>
            </tr>
          </thead>
          <tbody>
            {infrastructureCatalogue.map((item) => (
              <tr
                key={item.id}
                className={`border-b border-slate-100 ${
                  selected.has(item.id) ? "bg-soteria-accentSoft" : ""
                }`}
              >
                <td className="py-2 pr-3">
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => onToggle(item.id)}
                  />
                </td>
                <td className="py-2 pr-3">
                  <span className="block font-medium text-slate-800">
                    {item.service}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {item.provider} · {item.plan}
                  </span>
                </td>
                <td className="py-2 pr-3">
                  {item.providerPrice} {item.currency}
                </td>
                <td className="py-2 pr-3 capitalize">{item.billing}</td>
                <td className="py-2 pr-3">{treatmentLabel[item.costTreatment]}</td>
                <td className="py-2 pr-3 text-xs text-slate-500">
                  <span
                    className={
                      item.source.startsWith("PLACEHOLDER")
                        ? "chip border-soteria-warn text-soteria-warn"
                        : ""
                    }
                  >
                    {item.source.startsWith("PLACEHOLDER")
                      ? "Unverified"
                      : item.source}
                  </span>
                  <span className="mt-0.5 block">{item.lastVerified}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
