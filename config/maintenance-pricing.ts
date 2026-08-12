// Optional maintenance packages. Priced as a percentage of the recommended
// development price with a floor, so small projects still cover Soteria's
// minimum ongoing support cost.
//
// PLACEHOLDER VALUES — confirm percentages/floor with Soteria leadership.

import { MaintenancePlan } from "@/lib/types";

export const maintenancePlans: MaintenancePlan[] = [
  {
    id: "maintenance-none",
    name: "None",
    description: "No ongoing maintenance package. Client handles updates independently.",
    percentOfDevelopmentPrice: 0,
    minimumMonthlyUgx: 0,
    includes: [],
  },
  {
    id: "maintenance-basic",
    name: "Basic",
    description: "Uptime monitoring and critical bug fixes.",
    percentOfDevelopmentPrice: 3,
    minimumMonthlyUgx: 80_000,
    includes: [
      "Uptime monitoring",
      "Critical bug fixes",
      "Security patch application",
    ],
  },
  {
    id: "maintenance-standard",
    name: "Standard",
    description: "Basic plus minor content updates and monthly check-in.",
    percentOfDevelopmentPrice: 5,
    minimumMonthlyUgx: 150_000,
    includes: [
      "Everything in Basic",
      "Up to 2 hours of content/config updates per month",
      "Monthly health check-in",
    ],
  },
  {
    id: "maintenance-priority",
    name: "Priority",
    description: "Standard plus faster response times and technical administration.",
    percentOfDevelopmentPrice: 8,
    minimumMonthlyUgx: 250_000,
    includes: [
      "Everything in Standard",
      "Priority response (same business day)",
      "Infrastructure administration (renewals, upgrades)",
      "Up to 5 hours of change requests per month",
    ],
  },
];

export function getMaintenancePlanById(
  id: string | null
): MaintenancePlan | undefined {
  if (!id) return undefined;
  return maintenancePlans.find((p) => p.id === id);
}
