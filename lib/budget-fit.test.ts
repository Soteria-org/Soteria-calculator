import { describe, expect, it } from "vitest";
import { matchFeaturesToBrief, suggestScopeForBudget } from "./budget-fit";
import { ProjectInput } from "./types";

function baseInput(overrides: Partial<ProjectInput> = {}): ProjectInput {
  return {
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
    ...overrides,
  };
}

describe("matchFeaturesToBrief", () => {
  it("matches features by curated keyword, not arbitrary substring", () => {
    const matches = matchFeaturesToBrief(
      "We need a donation system so people can donate and a volunteer registration form."
    );
    const ids = matches.map((m) => m.feature.id);
    expect(ids).toContain("commerce-donations");
    expect(ids).toContain("engagement-volunteer-system");
  });

  it("returns nothing for blank input", () => {
    expect(matchFeaturesToBrief("")).toHaveLength(0);
    expect(matchFeaturesToBrief("   ")).toHaveLength(0);
  });

  it("returns nothing when no keywords appear", () => {
    expect(matchFeaturesToBrief("completely unrelated text about gardening")).toHaveLength(0);
  });
});

describe("suggestScopeForBudget", () => {
  const brief =
    "We need a donation system, a volunteer application system, and an events page with registration.";

  it("never proposes a scope priced above the stated budget", () => {
    // Comfortably above the mandatory base-system floor but below the cost
    // of everything matched, so this exercises a genuine partial fit.
    const result = suggestScopeForBudget(brief, 1_000_000, baseInput());
    expect(result.projectedPriceUgx).toBeLessThanOrEqual(1_000_000);
    expect(result.included.length).toBeGreaterThan(0);
    expect(result.included.length).toBeLessThan(result.matched.length);
  });

  it("still prices in the mandatory base system even when nothing fits", () => {
    // Below even the base system's own floor price — no optional feature
    // can ever be selected here, but the base system isn't optional, so
    // projectedPriceUgx reflects that floor rather than 0.
    const result = suggestScopeForBudget(brief, 100_000, baseInput());
    expect(result.included).toHaveLength(0);
    expect(result.projectedPriceUgx).toBeGreaterThan(100_000);
  });

  it("includes everything matched when the budget is generous, with zero shortfall", () => {
    const result = suggestScopeForBudget(brief, 50_000_000, baseInput());
    expect(result.excluded).toHaveLength(0);
    expect(result.included.length).toBe(result.matched.length);
    expect(result.shortfallUgx).toBe(0);
  });

  it("excludes matched features it can't afford, and reports a shortfall", () => {
    const result = suggestScopeForBudget(brief, 100_000, baseInput());
    expect(result.included).toHaveLength(0);
    expect(result.excluded.length).toBe(result.matched.length);
    expect(result.shortfallUgx).toBeGreaterThan(0);
  });
});
