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
import { ApiError, ApiUnavailableError, saveQuote } from "@/lib/api-client";

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

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "error"; message: string }
  | { status: "success"; projectId: number };

export default function CalculatorPage() {
  const [input, setInput] = useState<ProjectInput>(initialInput);
  const [view, setView] = useState<"internal" | "client">("internal");
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  const result = useMemo(() => calculateEstimate(input), [input]);

  function patch(update: Partial<ProjectInput>) {
    setInput((prev) => ({ ...prev, ...update }));
    // Any further edit invalidates the "saved" confirmation — the saved
    // quote is a snapshot of what was true when Save was clicked.
    if (saveState.status !== "idle" && saveState.status !== "saving") {
      setSaveState({ status: "idle" });
    }
  }

  function toggleFeature(id: string) {
    patch({
      selectedFeatureIds: input.selectedFeatureIds.includes(id)
        ? input.selectedFeatureIds.filter((f) => f !== id)
        : [...input.selectedFeatureIds, id],
    });
  }

  function toggleInfrastructure(id: string) {
    patch({
      selectedInfrastructureIds: input.selectedInfrastructureIds.includes(id)
        ? input.selectedInfrastructureIds.filter((f) => f !== id)
        : [...input.selectedInfrastructureIds, id],
    });
  }

  async function handleSaveQuote() {
    if (!input.clientName.trim() || !input.projectName.trim()) {
      setSaveState({
        status: "error",
        message: "Client name and project name are required to save a quote.",
      });
      return;
    }

    setSaveState({ status: "saving" });
    try {
      const { projectId } = await saveQuote({
        clientName: input.clientName.trim(),
        projectName: input.projectName.trim(),
        projectType: input.projectType.trim() || undefined,
        status: "draft",
        input,
        result,
      });
      setSaveState({ status: "success", projectId });
    } catch (err) {
      if (err instanceof ApiUnavailableError) {
        setSaveState({
          status: "error",
          message: "Records backend isn't reachable — see .env.local.example to set it up.",
        });
      } else if (err instanceof ApiError) {
        setSaveState({ status: "error", message: err.message });
      } else {
        setSaveState({ status: "error", message: "Could not save this quote." });
      }
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Link
            href="/"
            className="text-sm font-medium text-soteria-teal hover:text-soteria-tealLight hover:underline"
          >
            ← Back
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-soteria-ink">
            New estimate
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/projects" className="btn-secondary">
            Saved projects
          </Link>
          <button
            type="button"
            onClick={handleSaveQuote}
            disabled={saveState.status === "saving"}
            className="btn-secondary disabled:opacity-60"
          >
            {saveState.status === "saving" ? "Saving…" : "Save quote"}
          </button>
          <button type="button" onClick={() => window.print()} className="btn-primary">
            Print / Save PDF
          </button>
        </div>
      </div>

      {saveState.status === "error" && (
        <p className="field-hint mb-4 -mt-2 text-soteria-warn print:hidden">
          {saveState.message}
        </p>
      )}
      {saveState.status === "success" && (
        <p className="field-hint mb-4 -mt-2 print:hidden">
          Saved.{" "}
          <Link
            href={`/projects/${saveState.projectId}`}
            className="text-soteria-teal hover:text-soteria-tealLight hover:underline"
          >
            View project, create an invoice, or record a payment →
          </Link>
        </p>
      )}

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
