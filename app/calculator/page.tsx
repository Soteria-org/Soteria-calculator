"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProjectForm } from "@/components/ProjectForm";
import { FeatureSelector } from "@/components/FeatureSelector";
import { InfrastructureSelector } from "@/components/InfrastructureSelector";
import { MaintenanceSelector } from "@/components/MaintenanceSelector";
import { EstimateSummary } from "@/components/EstimateSummary";
import { PricingBreakdown } from "@/components/PricingBreakdown";
import { calculateEstimate } from "@/lib/calculator-engine";
import { ProjectInput } from "@/lib/types";

const initialInput: ProjectInput = {
  clientName: "",
  projectName: "",
  projectType: "",
  complexityLevel: "standard",
  confidence: "medium",
  selectedFeatureIds: [],
  selectedInfrastructureIds: [],
  maintenancePlanId: null,
  assumptions: [],
  risks: [],
  currency: "UGX",
};

export default function CalculatorPage() {
  const [input, setInput] = useState<ProjectInput>(initialInput);
  const [view, setView] = useState<"internal" | "client">("internal");

  const result = useMemo(() => calculateEstimate(input), [input]);

  function patch(update: Partial<ProjectInput>) {
    setInput((prev) => ({ ...prev, ...update }));
  }

  function toggleFeature(id: string) {
    setInput((prev) => ({
      ...prev,
      selectedFeatureIds: prev.selectedFeatureIds.includes(id)
        ? prev.selectedFeatureIds.filter((f) => f !== id)
        : [...prev.selectedFeatureIds, id],
    }));
  }

  function toggleInfrastructure(id: string) {
    setInput((prev) => ({
      ...prev,
      selectedInfrastructureIds: prev.selectedInfrastructureIds.includes(id)
        ? prev.selectedInfrastructureIds.filter((f) => f !== id)
        : [...prev.selectedInfrastructureIds, id],
    }));
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-soteria-accent hover:underline">
            ← Soteria Calculator
          </Link>
          <h1 className="text-xl font-bold text-slate-900">New estimate</h1>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-secondary"
        >
          Print / Save PDF
        </button>
      </div>

      <div className="space-y-6 print:hidden">
        <ProjectForm input={input} onChange={patch} />
        <FeatureSelector
          selectedIds={input.selectedFeatureIds}
          onToggle={toggleFeature}
        />
        <InfrastructureSelector
          selectedIds={input.selectedInfrastructureIds}
          onToggle={toggleInfrastructure}
        />
        <MaintenanceSelector
          selectedId={input.maintenancePlanId}
          onChange={(id) => patch({ maintenancePlanId: id })}
        />
      </div>

      <div className="mt-8 space-y-6">
        <EstimateSummary
          input={input}
          result={result}
          view={view}
          onViewChange={setView}
        />
        <PricingBreakdown result={result} view={view} />
      </div>
    </main>
  );
}
