import { describe, expect, it } from "vitest";
import { calculateEstimate } from "./calculator-engine";
import { BASE_SYSTEM_FEATURE_ID } from "@/config/development-pricing";
import { pricingRules } from "@/config/pricing-rules";
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

describe("calculateEstimate", () => {
  it("always includes the required base system feature, even with nothing selected", () => {
    const result = calculateEstimate(baseInput());
    expect(result.lineItems.map((li) => li.id)).toContain(BASE_SYSTEM_FEATURE_ID);
    expect(result.estimatedHours).toBeGreaterThan(0);
  });

  it("does not double-count a feature explicitly selected that is also required", () => {
    const result = calculateEstimate(
      baseInput({ selectedFeatureIds: [BASE_SYSTEM_FEATURE_ID] })
    );
    expect(
      result.lineItems.filter((li) => li.id === BASE_SYSTEM_FEATURE_ID)
    ).toHaveLength(1);
  });

  it("applies the complexity multiplier before contingency, not after", () => {
    const standard = calculateEstimate(
      baseInput({ complexityLevel: "standard", selectedFeatureIds: ["web-landing-page"] })
    );
    const complex = calculateEstimate(
      baseInput({ complexityLevel: "complex", selectedFeatureIds: ["web-landing-page"] })
    );
    expect(complex.subtotalUgx).toBe(standard.subtotalUgx);
    expect(complex.recommendedPriceUgx).toBeGreaterThan(standard.recommendedPriceUgx);
  });

  it("recommended price is between the lean and premium scenarios", () => {
    const result = calculateEstimate(
      baseInput({ selectedFeatureIds: ["web-landing-page", "web-seo"] })
    );
    const lean = result.scenarios.find((s) => s.scenario === "lean")!;
    const recommended = result.scenarios.find((s) => s.scenario === "recommended")!;
    const premium = result.scenarios.find((s) => s.scenario === "premium")!;

    expect(lean.developmentPriceUgx).toBeLessThanOrEqual(recommended.developmentPriceUgx);
    expect(premium.developmentPriceUgx).toBeGreaterThanOrEqual(
      recommended.developmentPriceUgx
    );
  });

  it("every scenario's deposit is at least the configured minimum, and never exceeds the price", () => {
    const result = calculateEstimate(baseInput());
    for (const scenario of result.scenarios) {
      expect(scenario.depositUgx).toBeGreaterThanOrEqual(
        Math.min(pricingRules.minimumDepositUgx, scenario.developmentPriceUgx)
      );
      expect(scenario.depositUgx).toBeLessThanOrEqual(scenario.developmentPriceUgx);
      expect(scenario.depositUgx + scenario.balanceUgx).toBe(scenario.developmentPriceUgx);
    }
  });

  it("excludes non-billable and one-time infrastructure items from recurring totals", () => {
    const result = calculateEstimate(
      baseInput({
        selectedInfrastructureIds: [
          "infra-email-resend", // absorbed, not client-billable
          "infra-sms-credits", // pass-through but one-time/per-unit
        ],
      })
    );
    expect(result.infrastructureMonthlyUgx).toBe(0);
    expect(result.infrastructureAnnualUgx).toBe(0);
  });

  it("adds the administered admin fee on top of the converted provider cost", () => {
    const result = calculateEstimate(
      baseInput({ selectedInfrastructureIds: ["infra-hosting-vercel"] })
    );
    const usdRate = pricingRules.rates.find((r) => r.code === "USD")!.ugxPerUnit;
    const expectedMonthly = 20 * usdRate + 20_000;
    expect(result.infrastructureMonthlyUgx).toBe(expectedMonthly);
    expect(result.infrastructureAnnualUgx).toBe(expectedMonthly * 12);
  });

  it("returns zero maintenance cost when no plan is selected", () => {
    const result = calculateEstimate(baseInput({ maintenancePlanId: null }));
    expect(result.maintenanceMonthlyUgx).toBe(0);
  });

  it("applies the maintenance plan's minimum floor for small development prices", () => {
    const result = calculateEstimate(
      baseInput({ maintenancePlanId: "maintenance-priority" })
    );
    const plan = result.maintenanceMonthlyUgx;
    expect(plan).toBeGreaterThanOrEqual(250_000);
  });
});
