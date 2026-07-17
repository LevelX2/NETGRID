import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";

import {
  runnerAdjustedPlanPriority,
  runnerDeckStrategyPlanPriorityBoost,
  runnerPressureProbeAllowance,
  runnerRunTargetCurrentStep,
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

  it("preserves concrete relative quality between equally recommended central runs", () => {
    const hqRun = runAction("run-hq", "hq");
    const rdRun = runAction("run-rd", "rd");
    const context = planContext({
      primaryStrategyId: "runner.rig_first",
      runTargetEvaluations: [
        runTargetEvaluation({
          actionId: hqRun.actionId,
          targetServerId: "hq",
          targetKind: "hq",
          recommendation: "run_now",
          accessPayoff: "trash_affordable",
          scoreThreat: false,
          score: 300,
        }),
        runTargetEvaluation({
          actionId: rdRun.actionId,
          targetServerId: "rd",
          targetKind: "rd",
          recommendation: "run_now",
          accessPayoff: "unknown",
          scoreThreat: false,
          score: 180,
        }),
      ],
    });

    expect(runnerAdjustedPlanPriority(context, hqRun, 740)).toBe(980);
    expect(runnerAdjustedPlanPriority(context, rdRun, 760)).toBe(880);
    expect(runnerAdjustedPlanPriority(context, hqRun, 740)).toBeGreaterThan(
      runnerAdjustedPlanPriority(context, rdRun, 760),
    );
    expect(runnerRunTargetPlanScoreBreakdown(context, hqRun, 740)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_central_run_relative_quality",
          value: 60,
        }),
      ]),
    );
  });

  it("retains the normal R&D preference when R&D has the better target score", () => {
    const hqRun = runAction("run-hq", "hq");
    const rdRun = runAction("run-rd", "rd");
    const context = planContext({
      primaryStrategyId: "runner.rig_first",
      runTargetEvaluations: [
        runTargetEvaluation({
          actionId: hqRun.actionId,
          targetServerId: "hq",
          targetKind: "hq",
          recommendation: "run_now",
          accessPayoff: "unknown",
          scoreThreat: false,
          score: 180,
        }),
        runTargetEvaluation({
          actionId: rdRun.actionId,
          targetServerId: "rd",
          targetKind: "rd",
          recommendation: "run_now",
          accessPayoff: "fresh",
          scoreThreat: false,
          score: 300,
        }),
      ],
    });

    expect(runnerAdjustedPlanPriority(context, rdRun, 760)).toBeGreaterThan(
      runnerAdjustedPlanPriority(context, hqRun, 740),
    );
  });

  it("preserves the last click for an urgent reachable remote contest", () => {
    const remoteRun = runAction("run-remote-1", "remote_1");
    const evaluation = runTargetEvaluation({
      actionId: remoteRun.actionId,
      targetServerId: "remote_1",
      targetKind: "remote",
      recommendation: "gain_credits_first",
      accessPayoff: "score_threat",
      scoreThreat: true,
      score: 1521,
    });
    const lastClickContext = planContext({
      primaryStrategyId: "runner.remote_contest",
      runnerClicks: 1,
      runTargetEvaluations: [evaluation],
    });
    const twoClickContext = planContext({
      primaryStrategyId: "runner.remote_contest",
      runnerClicks: 2,
      runTargetEvaluations: [evaluation],
    });
    const defaultStep = {
      stepId: "run_target:remote_1",
      kind: "run_target" as const,
      desiredActionSemantics: ["run.start"],
      rationale: ["urgent reachable score threat"],
    };

    expect(
      runnerRunTargetCurrentStep(lastClickContext, remoteRun, defaultStep),
    ).toMatchObject({
      kind: "run_target",
      desiredActionSemantics: ["run.start"],
    });
    expect(
      runnerRunTargetCurrentStep(twoClickContext, remoteRun, defaultStep),
    ).toMatchObject({
      kind: "gain_credits",
      desiredActionSemantics: ["economy.gain_credit"],
    });
  });

  it("funds only a path gap that can still convert into a run this turn", () => {
    const hqRun = runAction("run-hq", "hq");
    const defaultStep = {
      stepId: "probe_central:hq",
      kind: "probe_central" as const,
      desiredActionSemantics: ["run.start"],
    };
    const bounded = runTargetEvaluation({
      actionId: hqRun.actionId,
      targetServerId: "hq",
      targetKind: "hq",
      recommendation: "gain_credits_first",
      accessPayoff: "unknown",
      scoreThreat: false,
      score: -200,
      pathPassability: "blocked_unpayable",
      creditsAfterRun: -2,
    });
    const distant = runTargetEvaluation({
      ...bounded,
      creditsAfterRun: -5,
    });

    expect(
      runnerRunTargetCurrentStep(
        planContext({
          primaryStrategyId: "runner.hq_pressure",
          runnerClicks: 4,
          runTargetEvaluations: [bounded],
        }),
        hqRun,
        defaultStep,
      ),
    ).toMatchObject({ kind: "gain_credits" });
    expect(
      runnerRunTargetCurrentStep(
        planContext({
          primaryStrategyId: "runner.hq_pressure",
          runnerClicks: 4,
          runTargetEvaluations: [distant],
        }),
        hqRun,
        defaultStep,
      ),
    ).toMatchObject({ kind: "probe_central" });
  });

  it("converts a low-hand probabilistic breaker path into a hand-buffer step", () => {
    const remoteRun = runAction("run-remote-1", "remote_1");
    const evaluation = runTargetEvaluation({
      actionId: remoteRun.actionId,
      targetServerId: "remote_1",
      targetKind: "remote",
      recommendation: "draw_for_damage_buffer",
      accessPayoff: "score_threat",
      scoreThreat: true,
      score: -900,
      pathPassability: "blocked_by_blink_hand_buffer",
    });

    expect(
      runnerRunTargetCurrentStep(
        planContext({
          primaryStrategyId: "runner.remote_contest",
          runTargetEvaluations: [evaluation],
        }),
        remoteRun,
        {
          stepId: "run_target:remote_1",
          kind: "run_target",
          desiredActionSemantics: ["run.start"],
        },
      ),
    ).toMatchObject({
      kind: "draw_hand_buffer",
      desiredActionSemantics: ["draw.card"],
    });
  });

  it("keeps a fundable matchpoint R&D run above long-term economy plans", () => {
    const rdRun = runAction("run-rd", "rd");
    const evaluation = runTargetEvaluation({
      actionId: rdRun.actionId,
      targetServerId: "rd",
      targetKind: "rd",
      recommendation: "gain_credits_first",
      accessPayoff: "unknown",
      scoreThreat: false,
      score: -460,
      pathPassability: "blocked_unpayable",
      creditsAfterRun: -1,
      pathCost: 6,
    });
    const context = planContext({
      primaryStrategyId: "runner.rig_first",
      runnerClicks: 4,
      runnerAgendaPoints: 6,
      agendaPointsToWin: 7,
      runTargetEvaluations: [evaluation],
    });

    expect(runnerAdjustedPlanPriority(context, rdRun, 760)).toBe(1100);
    expect(runnerAdjustedPlanPriority(context, rdRun, 760)).toBeGreaterThan(
      940,
    );
    expect(
      runnerRunTargetCurrentStep(context, rdRun, {
        stepId: "probe_central:rd",
        kind: "probe_central",
        desiredActionSemantics: ["run.start"],
      }),
    ).toMatchObject({ kind: "gain_credits" });
    expect(runnerRunTargetPlanScoreBreakdown(context, rdRun, 760)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_matchpoint_run_conversion",
          value: 520,
        }),
      ]),
    );
  });

  it("converts an already reachable low-cost central run at matchpoint", () => {
    const hqRun = runAction("run-hq", "hq");
    const evaluation = runTargetEvaluation({
      actionId: hqRun.actionId,
      targetServerId: "hq",
      targetKind: "hq",
      recommendation: "gain_credits_first",
      accessPayoff: "unknown",
      scoreThreat: false,
      score: -40,
      pathPassability: "reachable",
      creditsAfterRun: 1,
      pathCost: 0,
    });
    const context = planContext({
      primaryStrategyId: "runner.rig_first",
      runnerClicks: 3,
      runnerAgendaPoints: 6,
      agendaPointsToWin: 7,
      runTargetEvaluations: [evaluation],
    });

    expect(runnerAdjustedPlanPriority(context, hqRun, 740)).toBe(1280);
    expect(
      runnerRunTargetCurrentStep(context, hqRun, {
        stepId: "probe_central:hq",
        kind: "probe_central",
        desiredActionSemantics: ["run.start"],
      }),
    ).toMatchObject({ kind: "probe_central" });
    expect(runnerRunTargetPlanScoreBreakdown(context, hqRun, 740)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_matchpoint_run_conversion",
          value: 720,
        }),
      ]),
    );
  });

  it("does not boost a reachable central with known low payoff at matchpoint", () => {
    const hqRun = runAction("run-hq", "hq");
    const evaluation = runTargetEvaluation({
      actionId: hqRun.actionId,
      targetServerId: "hq",
      targetKind: "hq",
      recommendation: "known_no_current_payoff",
      accessPayoff: "known_low_value",
      scoreThreat: false,
      score: -620,
      pathPassability: "reachable",
      creditsAfterRun: 1,
      pathCost: 0,
    });
    const context = planContext({
      primaryStrategyId: "runner.rig_first",
      runnerAgendaPoints: 6,
      agendaPointsToWin: 7,
      runTargetEvaluations: [evaluation],
    });

    expect(runnerAdjustedPlanPriority(context, hqRun, 740)).toBe(120);
    expect(runnerRunTargetPlanScoreBreakdown(context, hqRun, 740)).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "runner_matchpoint_run_conversion" }),
      ]),
    );
  });

  it("does not force a materially paid reachable central at matchpoint", () => {
    const hqRun = runAction("run-hq", "hq");
    const evaluation = runTargetEvaluation({
      actionId: hqRun.actionId,
      targetServerId: "hq",
      targetKind: "hq",
      recommendation: "gain_credits_first",
      accessPayoff: "unknown",
      scoreThreat: false,
      score: -120,
      pathPassability: "reachable",
      creditsAfterRun: 0,
      pathCost: 2,
    });
    const context = planContext({
      primaryStrategyId: "runner.rig_first",
      runnerAgendaPoints: 6,
      agendaPointsToWin: 7,
      runTargetEvaluations: [evaluation],
    });

    expect(runnerAdjustedPlanPriority(context, hqRun, 740)).toBe(560);
    expect(runnerRunTargetPlanScoreBreakdown(context, hqRun, 740)).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "runner_matchpoint_run_conversion" }),
      ]),
    );
  });

  it("does not boost a matchpoint run that cannot still be funded this turn", () => {
    const rdRun = runAction("run-rd", "rd");
    const evaluation = runTargetEvaluation({
      actionId: rdRun.actionId,
      targetServerId: "rd",
      targetKind: "rd",
      recommendation: "gain_credits_first",
      accessPayoff: "unknown",
      scoreThreat: false,
      score: -460,
      pathPassability: "blocked_unpayable",
      creditsAfterRun: -2,
      pathCost: 6,
    });
    const context = planContext({
      primaryStrategyId: "runner.rig_first",
      runnerClicks: 2,
      runnerAgendaPoints: 6,
      agendaPointsToWin: 7,
      runTargetEvaluations: [evaluation],
    });

    expect(runnerAdjustedPlanPriority(context, rdRun, 760)).toBe(580);
    expect(runnerRunTargetPlanScoreBreakdown(context, rdRun, 760)).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "runner_matchpoint_run_conversion" }),
      ]),
    );
  });

  it("defers ordinary paid runs during a binding economy transition", () => {
    const hqRun = runAction("run-hq", "hq");
    const paidRun = runTargetEvaluation({
      actionId: hqRun.actionId,
      targetServerId: "hq",
      targetKind: "hq",
      recommendation: "run_now",
      accessPayoff: "unknown",
      scoreThreat: false,
      score: 400,
      pathCost: 4,
    });
    const nearFreeRun = runTargetEvaluation({ ...paidRun, pathCost: 1 });
    const transition: NonNullable<
      NonNullable<
        TacticalPlanBuildContext["runnerEconomyPosture"]
      >["transition"]
    > = {
      phase: "economy_transition",
      commitment: "fund_economy",
      fundingHorizon: "short",
      sustainableEconomyInstalled: false,
      ordinaryPaidRunsDeferred: true,
      evidence: [],
    };

    const paidPriority = runnerAdjustedPlanPriority(
      planContext({
        primaryStrategyId: "runner.hq_pressure",
        runTargetEvaluations: [paidRun],
        economyTransition: transition,
      }),
      hqRun,
      760,
    );
    const nearFreePriority = runnerAdjustedPlanPriority(
      planContext({
        primaryStrategyId: "runner.hq_pressure",
        runTargetEvaluations: [nearFreeRun],
        economyTransition: transition,
      }),
      hqRun,
      760,
    );

    expect(nearFreePriority - paidPriority).toBe(520);
    expect(
      runnerRunTargetPlanScoreBreakdown(
        planContext({
          primaryStrategyId: "runner.hq_pressure",
          runTargetEvaluations: [paidRun],
          economyTransition: transition,
        }),
        hqRun,
        760,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_economy_transition_run_deferral",
          value: -520,
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
  runnerClicks?: number;
  runnerAgendaPoints?: number;
  agendaPointsToWin?: number;
  runTargetEvaluations?: RunnerRunTargetEvaluation[];
  economyTransition?: NonNullable<
    TacticalPlanBuildContext["runnerEconomyPosture"]
  >["transition"];
}): TacticalPlanBuildContext {
  return {
    input: {
      side: "runner",
      playerView: {
        agendaPointsToWin: input.agendaPointsToWin ?? 7,
        own: {
          clicks: input.runnerClicks ?? 4,
          agendaPoints: input.runnerAgendaPoints ?? 0,
        },
      },
    } as AiDecisionInput,
    strategicIntentState: {
      primaryStrategy: { strategyId: input.primaryStrategyId },
      secondaryStrategies: (input.secondaryStrategyIds ?? []).map(
        (strategyId) => ({
          strategyId,
        }),
      ),
    } as unknown as TacticalPlanBuildContext["strategicIntentState"],
    runnerRunTargetEvaluations: input.runTargetEvaluations,
    ...(input.economyTransition
      ? {
          runnerEconomyPosture: {
            transition: input.economyTransition,
          } as TacticalPlanBuildContext["runnerEconomyPosture"],
        }
      : {}),
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
  > &
    Partial<
      Pick<
        RunnerRunTargetEvaluation,
        "creditsAfterRun" | "pathPassability" | "pathCost"
      >
    >,
): RunnerRunTargetEvaluation {
  return {
    actionId: input.actionId,
    targetServerId: input.targetServerId,
    targetKind: input.targetKind,
    recommendation: input.recommendation,
    accessPayoff: input.accessPayoff,
    pathPassability: input.pathPassability ?? "reachable",
    knownAccessState: "unknown",
    creditsAfterRun: input.creditsAfterRun ?? 0,
    pathCost: input.pathCost ?? 0,
    scoreThreat: input.scoreThreat,
    score: input.score,
    evidence: [],
  } as unknown as RunnerRunTargetEvaluation;
}
