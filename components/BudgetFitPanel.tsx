"use client";

import { useState } from "react";
import { BudgetFitResult, suggestScopeForBudget } from "@/lib/budget-fit";
import { formatUgx } from "@/lib/format";
import { ProjectInput } from "@/lib/types";

interface BudgetFitPanelProps {
  input: ProjectInput;
  onApplyScope: (featureIds: string[]) => void;
}

export function BudgetFitPanel({ input, onApplyScope }: BudgetFitPanelProps) {
  const [open, setOpen] = useState(false);
  const [budgetText, setBudgetText] = useState("");
  const [requirements, setRequirements] = useState("");
  const [result, setResult] = useState<BudgetFitResult | null>(null);
  const [applied, setApplied] = useState(false);

  const budgetUgx = Number(budgetText.replace(/[^0-9]/g, ""));

  function handleSuggest() {
    setApplied(false);
    if (!requirements.trim() || !budgetUgx) {
      setResult(null);
      return;
    }
    setResult(suggestScopeForBudget(requirements, budgetUgx, input));
  }

  function handleApply() {
    if (!result) return;
    onApplyScope(result.included.map((f) => f.id));
    setApplied(true);
  }

  return (
    <section className="card p-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span>
          <h2 className="text-base font-semibold text-soteria-ink">
            Budget-fit assistant{" "}
            <span className="field-hint font-normal">(optional)</span>
          </h2>
          <p className="field-hint">
            Paste the client&rsquo;s full brief — however sprawling — and their
            budget, and see what actually fits before touching the scope
            checklist below.
          </p>
        </span>
        <span className="chip shrink-0">{open ? "Hide" : "Open"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
            <div>
              <label className="field-label" htmlFor="clientBudget">
                Client budget (UGX)
              </label>
              <input
                id="clientBudget"
                inputMode="numeric"
                className="input"
                value={budgetText}
                onChange={(e) => setBudgetText(e.target.value)}
                placeholder="e.g. 5,000,000"
              />
              <p className="field-hint">
                What they said they can spend — not what you&rsquo;d like to
                quote.
              </p>
            </div>
            <div>
              <label className="field-label" htmlFor="clientRequirements">
                Client&rsquo;s requirements (paste as-is)
              </label>
              <textarea
                id="clientRequirements"
                rows={8}
                className="input"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Paste the client's brief, RFP, or email here — even a long multi-system wishlist works."
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSuggest}
            className="btn-secondary w-full sm:w-auto"
          >
            Suggest scope for this budget
          </button>

          {result && (
            <div className="space-y-4 rounded-md border border-soteria-border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-soteria-body">
                  <span className="font-medium text-soteria-ink">
                    {formatUgx(result.projectedPriceUgx)}
                  </span>{" "}
                  at this scope, against a budget of{" "}
                  {formatUgx(result.budgetUgx)}.
                  {result.matched.length > 0 && result.included.length === 0 && (
                    <span className="block text-soteria-warn">
                      This is below what any project costs here — the
                      required base system alone already prices out at{" "}
                      {formatUgx(result.projectedPriceUgx)}. The client&rsquo;s
                      number needs revisiting, or try a leaner complexity
                      level.
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={result.included.length === 0}
                  className="btn-primary shrink-0 disabled:opacity-60"
                >
                  Apply {result.included.length} feature
                  {result.included.length === 1 ? "" : "s"} to scope
                </button>
              </div>

              {applied && (
                <p className="field-hint text-soteria-teal">
                  Applied — review and adjust in the Scope checklist below,
                  it&rsquo;s fully editable from here.
                </p>
              )}

              {result.included.length > 0 && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-soteria-gold">
                    Fits within budget ({result.included.length})
                  </h3>
                  <ul className="grid grid-cols-1 gap-1 text-sm text-soteria-body sm:grid-cols-2">
                    {result.included.map((f) => (
                      <li
                        key={f.id}
                        className="flex items-baseline justify-between gap-2 rounded bg-soteria-tealSoft px-2 py-1"
                      >
                        <span>{f.name}</span>
                        <span className="shrink-0 text-xs text-soteria-muted">
                          {formatUgx(f.basePrice)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.excluded.length > 0 && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-soteria-muted">
                    Matched, but needs more budget ({result.excluded.length})
                  </h3>
                  <ul className="grid grid-cols-1 gap-1 text-sm text-soteria-faint sm:grid-cols-2">
                    {result.excluded.map((f) => (
                      <li
                        key={f.id}
                        className="flex items-baseline justify-between gap-2 rounded bg-soteria-hoverWash px-2 py-1"
                      >
                        <span>{f.name}</span>
                        <span className="shrink-0 text-xs">
                          {formatUgx(f.basePrice)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {result.shortfallUgx > 0 && (
                    <p className="field-hint mt-1">
                      Delivering everything matched in the brief would need
                      about{" "}
                      <span className="font-medium text-soteria-ink">
                        {formatUgx(result.shortfallUgx)}
                      </span>{" "}
                      more than this budget.
                    </p>
                  )}
                </div>
              )}

              {result.matched.length === 0 && (
                <p className="field-hint">
                  Nothing in the catalogue matched this brief yet — either
                  it&rsquo;s genuinely outside what&rsquo;s priced here, or
                  the wording just doesn&rsquo;t hit a known keyword. Build
                  the scope manually in the checklist below instead.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
