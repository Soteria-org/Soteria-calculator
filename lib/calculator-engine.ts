// THE ONLY PLACE PRICE GETS COMPUTED.
//
// This module is a pure function over config + input. It must not read from
// the DOM, storage, or the network, and it must not import from components/.
// Components render what this returns; they never compute a price
// themselves. See docs/pricing-model.md for the reasoning behind each step.

import { developmentFeatures, getFeatureById } from "@/config/development-pricing";
import { infrastructureCatalogue } from "@/config/infrastructure-pricing";
import { getMaintenancePlanById } from "@/config/maintenance-pricing";
import { pricingRules } from "@/config/pricing-rules";
import { convertToUgx } from "./currency";
import {
  EstimateResult,
  EstimateScenario,
  EstimateScenarioKind,
  LineItem,
  ProjectInput,
} from "./types";

/** Rounds to the nearest configured increment (e.g. nearest 500 UGX). */
function roundToIncrement(amountUgx: number, incrementUgx: number): number {
  if (incrementUgx <= 0) return Math.round(amountUgx);
  return Math.round(amountUgx / incrementUgx) * incrementUgx;
}

function scenarioLabel(kind: EstimateScenarioKind): string {
  switch (kind) {
    case "lean":
      return "Lean";
    case "recommended":
      return "Recommended";
    case "premium":
      return "Premium";
  }
}

function buildScenario(
  kind: EstimateScenarioKind,
  developmentPriceUgx: number
): EstimateScenario {
  const deposit = Math.max(
    pricingRules.minimumDepositUgx,
    roundToIncrement(
      (developmentPriceUgx * pricingRules.defaultDepositPercent) / 100,
      pricingRules.roundingIncrementUgx
    )
  );
  const cappedDeposit = Math.min(deposit, developmentPriceUgx);

  return {
    scenario: kind,
    label: scenarioLabel(kind),
    developmentPriceUgx,
    depositUgx: cappedDeposit,
    balanceUgx: developmentPriceUgx - cappedDeposit,
  };
}

/** Resolves the full set of features that count toward this estimate:
 * everything explicitly selected, plus anything marked `required` (e.g.
 * the base system), deduplicated.
 */
function resolveSelectedFeatures(input: ProjectInput) {
  const ids = new Set(input.selectedFeatureIds);
  for (const feature of developmentFeatures) {
    if (feature.required) ids.add(feature.id);
  }
  return Array.from(ids)
    .map((id) => getFeatureById(id))
    .filter((f): f is NonNullable<typeof f> => f !== undefined);
}

function calculateInfrastructure(input: ProjectInput) {
  let monthlyUgx = 0;
  let annualOnlyUgx = 0;

  for (const id of input.selectedInfrastructureIds) {
    const item = infrastructureCatalogue.find((i) => i.id === id);
    if (!item || !item.clientBillable) continue;
    if (item.billing === "one-time") continue; // per-unit costs, not a subscription line

    const providerCostUgx = convertToUgx(
      item.providerPrice,
      item.currency,
      pricingRules.rates
    );
    const chargeUgx =
      item.costTreatment === "administered"
        ? providerCostUgx + (item.adminFeeUgx ?? 0)
        : providerCostUgx;

    if (item.billing === "monthly") {
      monthlyUgx += chargeUgx;
    } else {
      annualOnlyUgx += chargeUgx;
    }
  }

  return {
    infrastructureMonthlyUgx: monthlyUgx,
    infrastructureAnnualUgx: monthlyUgx * 12 + annualOnlyUgx,
  };
}

function calculateMaintenance(input: ProjectInput, recommendedPriceUgx: number) {
  const plan = getMaintenancePlanById(input.maintenancePlanId);
  if (!plan || plan.percentOfDevelopmentPrice <= 0) return 0;

  return Math.max(
    plan.minimumMonthlyUgx,
    roundToIncrement(
      (recommendedPriceUgx * plan.percentOfDevelopmentPrice) / 100,
      pricingRules.roundingIncrementUgx
    )
  );
}

export function calculateEstimate(input: ProjectInput): EstimateResult {
  const selectedFeatures = resolveSelectedFeatures(input);

  const lineItems: LineItem[] = selectedFeatures.map((f) => ({
    id: f.id,
    label: f.name,
    hours: f.hours,
    amountUgx: f.basePrice,
  }));

  const estimatedHours = selectedFeatures.reduce((sum, f) => sum + f.hours, 0);
  const subtotalUgx = selectedFeatures.reduce((sum, f) => sum + f.basePrice, 0);

  const complexity =
    pricingRules.complexityMultipliers.find(
      (m) => m.level === input.complexityLevel
    ) ?? pricingRules.complexityMultipliers[0];

  const complexityAdjustmentUgx = subtotalUgx * (complexity.multiplier - 1);
  const priceBeforeContingencyUgx = subtotalUgx + complexityAdjustmentUgx;

  const contingencyUgx =
    (priceBeforeContingencyUgx * pricingRules.contingencyPercent) / 100;

  const recommendedPriceUgx = roundToIncrement(
    priceBeforeContingencyUgx + contingencyUgx,
    pricingRules.roundingIncrementUgx
  );

  const leanPriceUgx = roundToIncrement(
    recommendedPriceUgx * pricingRules.leanMultiplier,
    pricingRules.roundingIncrementUgx
  );
  const premiumPriceUgx = roundToIncrement(
    recommendedPriceUgx * pricingRules.premiumMultiplier,
    pricingRules.roundingIncrementUgx
  );

  const internalCostUgx = estimatedHours * pricingRules.internalHourlyCostUgx;
  const marginCheckPercent =
    recommendedPriceUgx > 0
      ? ((recommendedPriceUgx - internalCostUgx) / recommendedPriceUgx) * 100
      : 0;

  const scenarios: EstimateScenario[] = [
    buildScenario("lean", leanPriceUgx),
    buildScenario("recommended", recommendedPriceUgx),
    buildScenario("premium", premiumPriceUgx),
  ];

  const durationBand =
    pricingRules.durationBands.find((b) => b.level === input.complexityLevel) ??
    pricingRules.durationBands[0];

  const { infrastructureMonthlyUgx, infrastructureAnnualUgx } =
    calculateInfrastructure(input);

  const maintenanceMonthlyUgx = calculateMaintenance(input, recommendedPriceUgx);

  return {
    lineItems,
    estimatedHours,
    subtotalUgx,
    complexityAdjustmentUgx,
    contingencyUgx,
    recommendedPriceUgx,
    internalCostUgx,
    marginCheckPercent,
    scenarios,
    estimatedWeeksMin: durationBand.minWeeks,
    estimatedWeeksMax: durationBand.maxWeeks,
    infrastructureMonthlyUgx,
    infrastructureAnnualUgx,
    maintenanceMonthlyUgx,
  };
}
