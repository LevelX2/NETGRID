import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";

import {
  runnerAdjustedPlanPriority,
  runnerDeckStrategyPlanPriorityBoost,
  runnerPressureProbeAllowance,
  runnerRunTargetPlanScoreBreakdown,
} from "./tactical-plan-runner-run-targets";
import type {
  RunnerPressureBudget,
  TacticalPlanBuildContext,
} from "./tactical-plan-types";

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

  it("applies deck strategy plan fit only to matching server plans", () => {
    const context = planContext({
      primaryStrategyId: "runner.rnd_pressure",
      secondaryStrategyIds: ["runner.remote_contest"],
    });

    expect(runnerDeckStrategyPlanPriorityBoost(context, "rd")).toBe(120);
    expect(runnerDeckStrategyPlanPriorityBoost(context, "hq")).toBe(0);
    expect(runnerDeckStrategyPlanPriorityBoost(context, "remote_1")).toBe(60);
  });

  it("keeps remote score-threat plan priority above deck-focused central pressure", () => {
    const remoteRun = runAction("run-remote-1", "remote_1");
    const rdRun = runAction("run-rd", "rd");
    const context = planContext({
      primaryStrategyId: "runner.rnd_pressure",
      runTargetEvaluations: [
        runTargetEvaluation({
          actionId: remoteRun.actionId,
          targetServerId: "remote_1",
          targetKind: "remote",
          recommendation: "gain_credits_first",
          accessPayoff: "score_threat",
          scoreThreat: true,
          score: 1250,
        }),
        runTargetEvaluation({
          actionId: rdRun.actionId,
          targetServerId: "rd",
          targetKind: "rd",
          recommendation: "run_now",
          accessPayoff: "fresh",
          scoreThreat: false,
          score: 640,
        }),
      ],
    });

    expect(runnerAdjustedPlanPriority(context, remoteRun, 820)).toBeGreaterThan(
      runnerAdjustedPlanPriority(context, rdRun, 760),
    );
    expect(runnerRunTargetPlanScoreBreakdown(context, rdRun, 760)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_deck_strategy_plan_fit",
          value: 120,
        }),
      ]),
    );
    expect(runnerRunTargetPlanScoreBreakdown(context, remoteRun, 820)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_run_target_recommendation",
          value: 340,
        }),
      ]),
    );
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

function planContext(input: {
  primaryStrategyId: string;
  secondaryStrategyIds?: string[];
  runTargetEvaluations?: RunnerRunTargetEvaluation[];
}): TacticalPlanBuildContext {
  return {
    input: { side: "runner" } as AiDecisionInput,
    strategicIntentState: {
      primaryStrategy: { strategyId: input.primaryStrategyId },
      secondaryStrategies: (input.secondaryStrategyIds ?? []).map(
        (strategyId) => ({
          strategyId,
        }),
      ),
    } as unknown as TacticalPlanBuildContext["strategicIntentState"],
    runnerRunTargetEvaluations: input.runTargetEvaluations,
  } as TacticalPlanBuildContext;
}

function runAction(actionId: string, serverId: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "start_run",
    label: actionId,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload: { serverId },
  };
}

function runTargetEvaluation(
  input: Pick<
    RunnerRunTargetEvaluation,
    | "accessPayoff"
    | "actionId"
    | "recommendation"
    | "score"
    | "scoreThreat"
    | "targetKind"
    | "targetServerId"
  >,
): RunnerRunTargetEvaluation {
  return {
    actionId: input.actionId,
    targetServerId: input.targetServerId,
    targetKind: input.targetKind,
    recommendation: input.recommendation,
    accessPayoff: input.accessPayoff,
    pathPassability: "reachable",
    knownAccessState: "unknown",
    creditsAfterRun: 0,
    scoreThreat: input.scoreThreat,
    score: input.score,
    evidence: [],
  } as unknown as RunnerRunTargetEvaluation;
}
