// Shared vocabulary between config, the calculator engine, and the UI.
// This file has no logic and no pricing values — it only describes shape.
// See docs/pricing-model.md for what each field means commercially.

// --- Shared scales -----------------------------------------------------

/**
 * Project-level complexity. Drives both the price multiplier
 * (pricing-rules.ts complexityMultipliers) and the timeline band
 * (pricing-rules.ts durationBands). Not the same scale as a single
 * feature's `complexity` (FeatureComplexity) — a "standard" project can
 * still contain a "high" complexity feature.
 */
export type ComplexityLevel = "lean" | "standard" | "complex" | "high-uncertainty";

/** How confident Soteria is in the brief this estimate is based on. */
export type EstimateConfidence = "high" | "medium" | "low";

/** Per-feature relative build complexity. Informational — does not affect price directly. */
export type FeatureComplexity = "low" | "medium" | "high";

export type FeatureCategory =
  | "website"
  | "cms"
  | "auth"
  | "commerce"
  | "business-management"
  | "integrations"
  | "ai"
  | "advanced";

/** How Soteria treats a recurring provider cost commercially. */
export type CostTreatment =
  | "pass-through" // billed to the client at provider cost, no markup
  | "administered" // provider cost + Soteria's admin fee
  | "absorbed" // Soteria pays it, not billed to the client
  | "bundled"; // folded into the maintenance package rather than billed alone

export type InfrastructureBilling = "monthly" | "annual" | "one-time";

export type SupportedCurrency = "UGX" | "USD" | "EUR" | "GBP";

export type EstimateScenarioKind = "lean" | "recommended" | "premium";

// --- config/pricing-rules.ts --------------------------------------------

export interface ComplexityMultiplier {
  level: ComplexityLevel;
  label: string;
  multiplier: number;
  description: string;
}

export interface DurationBand {
  level: ComplexityLevel;
  label: string;
  minWeeks: number;
  maxWeeks: number;
  note: string;
}

export interface FxRate {
  code: Exclude<SupportedCurrency, "UGX">;
  ugxPerUnit: number;
  source: string;
  lastVerified: string;
}

export interface PricingRules {
  defaultMarginPercent: number;
  defaultDepositPercent: number;
  minimumDepositUgx: number;
  contingencyPercent: number;
  internalHourlyCostUgx: number;
  roundingIncrementUgx: number;
  leanMultiplier: number;
  premiumMultiplier: number;
  complexityMultipliers: ComplexityMultiplier[];
  durationBands: DurationBand[];
  baseCurrency: "UGX";
  rates: FxRate[];
}

// --- config/development-pricing.ts --------------------------------------

export interface FeatureDefinition {
  id: string;
  category: FeatureCategory;
  name: string;
  description: string;
  /** Estimated hours at standard complexity. */
  hours: number;
  /** Price at standard project complexity, before the project-level multiplier. */
  basePrice: number;
  complexity: FeatureComplexity;
  /** Always included in every estimate, regardless of selection. */
  required?: boolean;
  /** Feature ids this one assumes are already selected. Informational only in V1. */
  dependsOn?: string[];
  notes?: string;
}

// --- config/infrastructure-pricing.ts -----------------------------------

export interface InfrastructureItem {
  id: string;
  provider: string;
  service: string;
  plan: string;
  providerPrice: number;
  currency: SupportedCurrency;
  billing: InfrastructureBilling;
  allowance?: string;
  overage?: string;
  source: string;
  lastVerified: string;
  costTreatment: CostTreatment;
  /** Only relevant when costTreatment === "administered". */
  adminFeeUgx?: number;
  /** Whether this item appears in the client's recurring cost total at all. */
  clientBillable: boolean;
  notes?: string;
}

// --- config/maintenance-pricing.ts --------------------------------------

export interface MaintenancePlan {
  id: string;
  name: string;
  description: string;
  percentOfDevelopmentPrice: number;
  minimumMonthlyUgx: number;
  includes: string[];
}

// --- Calculator input/output ---------------------------------------------

export interface ProjectInput {
  clientName: string;
  projectName: string;
  projectType: string;
  complexityLevel: ComplexityLevel;
  confidence: EstimateConfidence;
  selectedFeatureIds: string[];
  selectedInfrastructureIds: string[];
  maintenancePlanId: string | null;
  assumptions: string[];
  risks: string[];
  currency: "UGX";
}

export interface LineItem {
  id: string;
  label: string;
  hours: number;
  amountUgx: number;
}

export interface EstimateScenario {
  scenario: EstimateScenarioKind;
  label: string;
  developmentPriceUgx: number;
  depositUgx: number;
  balanceUgx: number;
}

export interface EstimateResult {
  lineItems: LineItem[];
  estimatedHours: number;
  subtotalUgx: number;
  complexityAdjustmentUgx: number;
  contingencyUgx: number;
  recommendedPriceUgx: number;
  internalCostUgx: number;
  marginCheckPercent: number;
  scenarios: EstimateScenario[];
  estimatedWeeksMin: number;
  estimatedWeeksMax: number;
  infrastructureMonthlyUgx: number;
  infrastructureAnnualUgx: number;
  maintenanceMonthlyUgx: number;
}
