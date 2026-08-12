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
      <h2 className="text-base font-semibold text-soteria-ink">
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
            <tr className="border-b border-soteria-border text-xs uppercase tracking-wide text-soteria-muted">
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
                className={`border-b border-soteria-border ${
                  selected.has(item.id) ? "bg-soteria-tealSoft" : ""
                }`}
              >
                <td className="py-2 pr-3">
                  <input
                    type="checkbox"
                    className="accent-soteria-teal"
                    checked={selected.has(item.id)}
                    onChange={() => onToggle(item.id)}
                  />
                </td>
                <td className="py-2 pr-3">
                  <span className="block font-medium text-soteria-ink">
                    {item.service}
                  </span>
                  <span className="block text-xs text-soteria-muted">
                    {item.provider} · {item.plan}
                  </span>
                </td>
                <td className="py-2 pr-3 text-soteria-body">
                  {item.providerPrice} {item.currency}
                </td>
                <td className="py-2 pr-3 capitalize text-soteria-body">
                  {item.billing}
                </td>
                <td className="py-2 pr-3 text-soteria-body">
                  {treatmentLabel[item.costTreatment]}
                </td>
                <td className="py-2 pr-3 text-xs text-soteria-muted">
                  <span
                    className={
                      item.source.startsWith("PLACEHOLDER")
                        ? "chip border-soteria-warn/40 bg-soteria-warnSoft text-soteria-warn"
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
