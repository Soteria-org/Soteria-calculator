"use client";

import { pricingRules } from "@/config/pricing-rules";
import { EstimateConfidence, ProjectInput } from "@/lib/types";

interface ProjectFormProps {
  input: ProjectInput;
  onChange: (patch: Partial<ProjectInput>) => void;
}

const confidenceOptions: { value: EstimateConfidence; label: string }[] = [
  { value: "high", label: "High — requirements are clear" },
  { value: "medium", label: "Medium — some assumptions needed" },
  { value: "low", label: "Low — significant unknowns remain" },
];

export function ProjectForm({ input, onChange }: ProjectFormProps) {
  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold text-slate-900">
        1. Client & project
      </h2>
      <p className="field-hint mb-4">
        Who is this for, and how confident are we in what they've told us?
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="clientName">
            Client name
          </label>
          <input
            id="clientName"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={input.clientName}
            onChange={(e) => onChange({ clientName: e.target.value })}
            placeholder="e.g. John Baptist"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="projectName">
            Project name
          </label>
          <input
            id="projectName"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={input.projectName}
            onChange={(e) => onChange({ projectName: e.target.value })}
            placeholder="e.g. Gadget Store E-Commerce System"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="projectType">
            Project type
          </label>
          <input
            id="projectType"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={input.projectType}
            onChange={(e) => onChange({ projectType: e.target.value })}
            placeholder="e.g. E-commerce + business management"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="complexityLevel">
            Overall complexity
          </label>
          <select
            id="complexityLevel"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={input.complexityLevel}
            onChange={(e) =>
              onChange({
                complexityLevel: e.target.value as ProjectInput["complexityLevel"],
              })
            }
          >
            {pricingRules.complexityMultipliers.map((m) => (
              <option key={m.level} value={m.level}>
                {m.label} (×{m.multiplier.toFixed(2)})
              </option>
            ))}
          </select>
          <p className="field-hint">
            {
              pricingRules.complexityMultipliers.find(
                (m) => m.level === input.complexityLevel
              )?.description
            }
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label className="field-label">Estimate confidence</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          {confidenceOptions.map((opt) => (
            <label
              key={opt.value}
              className={`flex-1 cursor-pointer rounded-md border px-3 py-2 text-sm ${
                input.confidence === opt.value
                  ? "border-soteria-accent bg-soteria-accentSoft text-soteria-accent"
                  : "border-slate-300 text-slate-600"
              }`}
            >
              <input
                type="radio"
                name="confidence"
                className="mr-2"
                checked={input.confidence === opt.value}
                onChange={() => onChange({ confidence: opt.value })}
              />
              {opt.label}
            </label>
          ))}
        </div>
        <p className="field-hint">
          Low confidence should show up in the quote as an assumption, not get
          silently priced away.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="assumptions">
            Assumptions (one per line)
          </label>
          <textarea
            id="assumptions"
            rows={4}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={input.assumptions.join("\n")}
            onChange={(e) =>
              onChange({
                assumptions: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Client will supply branding assets&#10;Payment provider account supplied by client"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="risks">
            Risks (one per line)
          </label>
          <textarea
            id="risks"
            rows={4}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={input.risks.join("\n")}
            onChange={(e) =>
              onChange({
                risks: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Payment gateway credentials not yet confirmed"
          />
        </div>
      </div>
    </section>
  );
}
