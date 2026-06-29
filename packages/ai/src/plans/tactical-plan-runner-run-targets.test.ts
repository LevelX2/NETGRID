import { describe, expect, it } from "vitest";

import { runnerPressureProbeAllowance } from "./tactical-plan-runner-run-targets";
import type { RunnerPressureBudget } from "./tactical-plan-types";

describe("runnerPressureProbeAllowance", () => {
  it("allows pressure probes only for exact server ids", () => {
    const budget = pressureBudget({
      allowedProbeTargets: ["remote_10"],
    });

    expect(runnerPressureProbeAllowance(budget, "remote_10")).toMatchObject({
      priorityBonus: 180,
      evidence: expect.arrayContaining(["pressure_probe_allowed:true"]),
    });
    expect(runnerPressureProbeAllowance(budget, "remote_1")).toMatchObject({
      priorityBonus: 0,
      evidence: budget.evidence,
    });
  });
});

function pressureBudget(
  overrides: Partial<RunnerPressureBudget> = {},
): RunnerPressureBudget {
  return {
    canSpendActionOnPressure: true,
    pressureActionBudgetThisTurn: 1,
    maxCreditLossForProbe: 0,
    allowedProbeTargets: [],
    nearTieProbeTargets: [],
    blockedReasons: [],
    boundedVariationApplied: false,
    variationReason: "deterministic_priority_only",
    evidence: ["pressure_budget:available"],
    ...overrides,
  };
}
