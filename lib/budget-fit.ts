// Budget-fit assistant: given a client's raw brief (often a long,
// sprawling requirements dump) and a stated budget, suggests which
// catalogue features to select so the resulting quote fits that budget.
//
// Deliberately NOT an AI call — matching is plain keyword lookup against
// FeatureDefinition.keywords (config/development-pricing.ts), and pricing
// is delegated entirely to calculateEstimate (calculator-engine.ts), the
// single source of truth for price. This module only decides *which*
// feature ids to try, never what they cost — consistent with the rest of
// the app's "every number traceable, no AI guesses" principle.

import { BASE_SYSTEM_FEATURE_ID, developmentFeatures } from "@/config/development-pricing";
import { calculateEstimate } from "./calculator-engine";
import { FeatureDefinition, ProjectInput } from "./types";

export interface ScoredFeature {
  feature: FeatureDefinition;
  score: number;
  matchedTerms: string[];
}

export interface BudgetFitResult {
  /** Features whose keywords appeared in the brief, best match first. */
  matched: ScoredFeature[];
  /** Matched features that fit within budget (excludes the always-included base system). */
  included: FeatureDefinition[];
  /** Matched features that didn't fit within budget. */
  excluded: FeatureDefinition[];
  /** Recommended price for the included set (base system + included), via calculateEstimate. */
  projectedPriceUgx: number;
  budgetUgx: number;
  /** Recommended price if every matched feature were included, regardless of budget. */
  fullMatchedPriceUgx: number;
  /** How much more budget the full matched scope would need. 0 if it already fits. */
  shortfallUgx: number;
}

function normalize(text: string): string {
  return text.toLowerCase();
}

/** Matches free-text requirements against the catalogue's curated keywords. */
export function matchFeaturesToBrief(requirementsText: string): ScoredFeature[] {
  const text = normalize(requirementsText);
  if (!text.trim()) return [];

  return developmentFeatures
    .filter((f) => !f.required && f.keywords && f.keywords.length > 0)
    .map((feature) => {
      const matchedTerms = (feature.keywords ?? []).filter((term) =>
        text.includes(term.toLowerCase())
      );
      return { feature, score: matchedTerms.length, matchedTerms };
    })
    .filter((m) => m.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.feature.basePrice - b.feature.basePrice
    );
}

function developmentPriceFor(featureIds: string[], input: ProjectInput): number {
  return calculateEstimate({ ...input, selectedFeatureIds: featureIds }).recommendedPriceUgx;
}

/**
 * Greedily builds the largest matched-feature set (best matches first, then
 * cheapest-first on ties) whose recommended price stays within budget.
 * `input` supplies context (complexity level, etc.) that calculateEstimate
 * needs — only its selectedFeatureIds is overridden per candidate.
 */
export function suggestScopeForBudget(
  requirementsText: string,
  budgetUgx: number,
  input: ProjectInput
): BudgetFitResult {
  const matched = matchFeaturesToBrief(requirementsText);

  let includedIds: string[] = [];
  const included: FeatureDefinition[] = [];
  const excluded: FeatureDefinition[] = [];

  for (const { feature } of matched) {
    if (feature.id === BASE_SYSTEM_FEATURE_ID) continue;
    const candidateIds = [...includedIds, feature.id];
    const price = developmentPriceFor(candidateIds, input);
    if (price <= budgetUgx) {
      includedIds = candidateIds;
      included.push(feature);
    } else {
      excluded.push(feature);
    }
  }

  const fullMatchedIds = matched
    .map((m) => m.feature.id)
    .filter((id) => id !== BASE_SYSTEM_FEATURE_ID);

  const projectedPriceUgx = developmentPriceFor(includedIds, input);
  const fullMatchedPriceUgx = developmentPriceFor(fullMatchedIds, input);

  return {
    matched,
    included,
    excluded,
    projectedPriceUgx,
    budgetUgx,
    fullMatchedPriceUgx,
    shortfallUgx: Math.max(0, fullMatchedPriceUgx - budgetUgx),
  };
}
