"use client";

import { maintenancePlans } from "@/config/maintenance-pricing";

interface MaintenanceSelectorProps {
  selectedId: string | null;
  onChange: (id: string | null) => void;
}

export function MaintenanceSelector({
  selectedId,
  onChange,
}: MaintenanceSelectorProps) {
  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold text-soteria-ink">
        4. Maintenance (optional)
      </h2>
      <p className="field-hint mb-4">
        Priced as a percentage of the recommended development price, with a
        floor so small projects still cover Soteria's minimum support cost.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {maintenancePlans.map((plan) => (
          <label
            key={plan.id}
            className={`cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors ${
              selectedId === plan.id
                ? "border-soteria-teal bg-soteria-tealSoft"
                : "border-soteria-border hover:border-soteria-borderStrong"
            }`}
          >
            <input
              type="radio"
              name="maintenance"
              className="mr-2 accent-soteria-teal"
              checked={selectedId === plan.id}
              onChange={() => onChange(plan.id === "maintenance-none" ? null : plan.id)}
            />
            <span className="font-medium text-soteria-ink">{plan.name}</span>
            <span className="block text-xs text-soteria-muted">
              {plan.percentOfDevelopmentPrice > 0
                ? `${plan.percentOfDevelopmentPrice}% of dev price, min. ${plan.minimumMonthlyUgx.toLocaleString()} UGX/mo`
                : "No ongoing package"}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
