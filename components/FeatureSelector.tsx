"use client";

import {
  BASE_SYSTEM_FEATURE_ID,
  developmentFeatures,
} from "@/config/development-pricing";
import { formatUgx } from "@/lib/format";
import { FeatureCategory } from "@/lib/types";

interface FeatureSelectorProps {
  selectedIds: string[];
  onToggle: (id: string) => void;
}

const categoryLabels: Record<FeatureCategory, string> = {
  website: "Website & design",
  cms: "CMS",
  auth: "Authentication",
  commerce: "Commerce",
  "business-management": "Business management",
  integrations: "Integrations",
  ai: "AI",
  advanced: "Advanced",
};

const categoryOrder: FeatureCategory[] = [
  "website",
  "cms",
  "auth",
  "commerce",
  "business-management",
  "integrations",
  "ai",
  "advanced",
];

export function FeatureSelector({
  selectedIds,
  onToggle,
}: FeatureSelectorProps) {
  const selected = new Set(selectedIds);

  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold text-slate-900">2. Scope</h2>
      <p className="field-hint mb-4">
        Select what this project actually needs. Pricing is per feature, not
        per page — a 10-page brochure site should cost less than a 4-page
        app with inventory and payments.
      </p>

      <div className="space-y-6">
        {categoryOrder.map((category) => {
          const features = developmentFeatures.filter(
            (f) => f.category === category && f.id !== BASE_SYSTEM_FEATURE_ID
          );
          if (features.length === 0) return null;
          return (
            <div key={category}>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">
                {categoryLabels[category]}
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {features.map((f) => (
                  <label
                    key={f.id}
                    className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                      selected.has(f.id)
                        ? "border-soteria-accent bg-soteria-accentSoft"
                        : "border-slate-200"
                    }`}
                    title={f.description}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={selected.has(f.id)}
                      onChange={() => onToggle(f.id)}
                    />
                    <span className="flex-1">
                      <span className="block font-medium text-slate-800">
                        {f.name}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {f.hours}h · {formatUgx(f.basePrice)}
                        {f.notes ? ` · ${f.notes}` : ""}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
