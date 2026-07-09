import type { LegalAction } from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import {
  runnerPressurePreferredProbeTarget,
  runnerPressureProbeBasePriority,
  runnerPressureProbeTargetAllowed,
  runnerRunTargetTacticalPriorityDelta,
} from "../runner-run-target-guidance";
import { createPlanStep } from "./tactical-plan-builders";
import { actionServerId } from "./tactical-plan-server-targets";
import { usefulLegalRunnerHandDevelopment } from "./tactical-plan-runner-hand-development";
import type {
  PlanScoreBreakdown,
  PlanStep,
  RunnerPressureBudget,
  TacticalPlanBuildContext,
} from "./tactical-plan-types";

export function runnerAdjustedPlanPriority(
  context: TacticalPlanBuildContext,
  action: LegalAction,
  basePriority: number,
): number {
  const evaluation = runnerRunTargetEvaluationForAction(context, action);
  const serverId = actionServerId(action);
  return (
    basePriority +
    (evaluation ? runnerRunTargetPlanPriorityDelta(evaluation) : 0) +
    runnerDeckStrategyPlanPriorityBoost(context, serverId)
  );
}

export function runnerRunTargetPlanScoreBreakdown(
  context: TacticalPlanBuildContext,
  action: LegalAction,
  basePriority: number,
): PlanScoreBreakdown[] {
  const evaluation = runnerRunTargetEvaluationForAction(context, action);
  const serverId = actionServerId(action);
  return [
    {
      key: "runner_run_target_base",
      label:
        serverId === "hq" || serverId === "rd"
          ? "Zentral-Run-Basis"
          : "Remote-Run-Basis",
      value: basePriority,
      reason: serverId ?? action.actionId,
    },
    ...(evaluation
      ? [
          {
            key: "runner_run_target_recommendation",
            label: "RunTarget-Empfehlung",
            value: runnerRunTargetPlanPriorityDelta(evaluation),
            reason: [
              evaluation.recommendation,
              `payoff:${evaluation.accessPayoff}`,
              `score:${evaluation.score}`,
              ...(evaluation.scoreThreat ? ["score_threat:true"] : []),
            ].join(";"),
          },
        ]
      : []),
    ...runnerDeckStrategyPlanScoreBreakdown(context, actionServerId(action)),
  ];
}

export function runnerCentralRunOpportunityFloor(
  context: TacticalPlanBuildContext,
  action: LegalAction,
): { priority: number; reason: string; evidence: string[] } | undefined {
  const serverId = actionServerId(action);
  if (serverId !== "rd") return undefined;
  const creditBasePriority =
    context.runnerEconomyPosture?.creditBasePlan.economyPriority;
  const competesWithCreditBase =
    creditBasePriority === "high" ||
    creditBasePriority === "medium" ||
    context.runnerEconomyPosture?.recommendation === "build_economy";
  if (!competesWithCreditBase) return undefined;
  const server = context.input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const evaluation = runnerRunTargetEvaluationForAction(context, action);
  if (evaluation) {
    const lowCostReachable =
      evaluation.pathPassability === "reachable" &&
      evaluation.creditsAfterRun >= 0 &&
      evaluation.pathCost <= 1;
    const unknownOrUsefulTop =
      evaluation.knownAccessState === "unknown" ||
      evaluation.accessPayoff === "fresh" ||
      evaluation.accessPayoff === "access_bonus";
    const runRecommended =
      evaluation.recommendation === "run_now" ||
      evaluation.recommendation === "run_if_free";
    if (!lowCostReachable || !unknownOrUsefulTop || !runRecommended) {
      return undefined;
    }
  } else if ((server?.ice.length ?? 0) > 0) {
    return undefined;
  }
  const unguarded = (server?.ice.length ?? 0) === 0;
  const priority = 940;
  const reason = [
    "target:rd",
    evaluation
      ? `recommendation:${evaluation.recommendation}`
      : "recommendation:visible_unguarded",
    evaluation
      ? `known_access_state:${evaluation.knownAccessState}`
      : "known_access_state:unknown",
    evaluation ? `path_cost:${evaluation.pathCost}` : "path_cost:0",
    `unguarded:${unguarded}`,
  ].join("|");
  return {
    priority,
    reason,
    evidence: [
      "rd_unknown_low_cost_opportunity_floor:true",
      `rd_opportunity_floor:${priority}`,
      ...(evaluation ? evaluation.evidence.slice(0, 10) : []),
    ],
  };
}

export function runnerEconomyGoalPriority(
  context: TacticalPlanBuildContext,
  basePriority: number,
): number {
  const posture = context.runnerEconomyPosture;
  if (!posture) return basePriority;
  if (posture.recommendation === "cash_out_bank") return basePriority + 160;
  if (posture.creditBasePlan.recommendation === "fund_useful_hand_card")
    return basePriority + 140;
  if (posture.creditBasePlan.economyPriority === "high")
    return basePriority + 120;
  if (posture.recommendation === "build_economy") return basePriority + 90;
  return basePriority;
}

const RUNNER_PRESSURE_PROBE_PRIORITY_BONUS = 180;
const RUNNER_PRESSURE_PROBE_VARIATION_BONUS = 25;
const RUNNER_PRESSURE_PROBE_NEAR_TIE_WINDOW = 25;

export function assessRunnerPressureBudget(
  context: TacticalPlanBuildContext,
): RunnerPressureBudget {
  const reservePolicy = context.runnerEconomyPosture?.creditReservePolicy;
  const creditBase = context.runnerEconomyPosture?.creditBasePlan;
  const usefulHandDevelopmentAvailable = (
    context.runnerHandDevelopmentEvaluations ?? []
  ).some(usefulLegalRunnerHandDevelopment);
  const reservePressureActive =
    creditBase !== undefined &&
    creditBase.economyPriority !== "low" &&
    reservePolicy !== undefined &&
    reservePolicy.belowReserveNow;
  const remoteFundingNeed =
    reservePolicy !== undefined &&
    reservePolicy.remoteScoreThreat !== "none" &&
    reservePolicy.belowReserveNow &&
    reservePolicy.canContestIfFunded;
  const allowedProbeEvaluations = (
    context.runnerRunTargetEvaluations ?? []
  ).filter((evaluation) => runnerPressureProbeTargetAllowed(evaluation));
  const allowedProbeTargets = allowedProbeEvaluations
    .map((evaluation) => evaluation.targetServerId)
    .sort();
  const probeBaselines = allowedProbeEvaluations
    .map((evaluation) => ({
      targetServerId: evaluation.targetServerId,
      priority: runnerPressureProbeBasePriority(evaluation),
    }))
    .sort((left, right) =>
      left.targetServerId.localeCompare(right.targetServerId),
    );
  const bestProbeBaseline = Math.max(
    0,
    ...probeBaselines.map((baseline) => baseline.priority),
  );
  const nearTieProbeTargets = probeBaselines
    .filter(
      (baseline) =>
        bestProbeBaseline - baseline.priority <=
        RUNNER_PRESSURE_PROBE_NEAR_TIE_WINDOW,
    )
    .map((baseline) => baseline.targetServerId);
  const blockedReasons = [
    ...(!reservePressureActive ? ["reserve_pressure_inactive"] : []),
    ...(usefulHandDevelopmentAvailable
      ? ["useful_hand_development_available"]
      : []),
    ...(remoteFundingNeed ? ["remote_contest_funding_need"] : []),
    ...(allowedProbeTargets.length === 0 ? ["no_safe_probe_target"] : []),
  ];
  const canSpendActionOnPressure =
    context.input.side === "runner" &&
    reservePressureActive &&
    !usefulHandDevelopmentAvailable &&
    !remoteFundingNeed &&
    allowedProbeTargets.length > 0;
  const boundedVariationApplied =
    canSpendActionOnPressure && nearTieProbeTargets.length > 1;
  const preferredProbeTarget = boundedVariationApplied
    ? runnerPressurePreferredProbeTarget(
        nearTieProbeTargets,
        context.input.playerView.stateVersion,
      )
    : undefined;
  const variationReason = boundedVariationApplied
    ? "near_tie_state_version"
    : "deterministic_priority_only";
  return {
    canSpendActionOnPressure,
    pressureActionBudgetThisTurn: canSpendActionOnPressure ? 1 : 0,
    maxCreditLossForProbe: 0,
    allowedProbeTargets,
    nearTieProbeTargets,
    ...(preferredProbeTarget ? { preferredProbeTarget } : {}),
    blockedReasons,
    boundedVariationApplied,
    variationReason,
    evidence: [
      `pressure_budget:${canSpendActionOnPressure ? "available" : "blocked"}`,
      `pressure_action_budget:${canSpendActionOnPressure ? 1 : 0}`,
      "max_credit_loss_for_probe:0",
      `allowed_probe_targets:${allowedProbeTargets.join("|") || "none"}`,
      `near_tie_probe_targets:${nearTieProbeTargets.join("|") || "none"}`,
      `preferred_probe_target:${preferredProbeTarget ?? "none"}`,
      `blocked_pressure_reasons:${blockedReasons.join("|") || "none"}`,
      `bounded_variation_applied:${boundedVariationApplied}`,
      `variation_reason:${variationReason}`,
    ],
  };
}

export function runnerPressureProbeAllowance(
  budget: RunnerPressureBudget,
  serverId: string,
): { priorityBonus: number; evidence: string[] } {
  const allowedProbeTargetSet = new Set(budget.allowedProbeTargets);
  if (
    !budget.canSpendActionOnPressure ||
    !allowedProbeTargetSet.has(serverId)
  ) {
    return {
      priorityBonus: 0,
      evidence: budget.evidence,
    };
  }
  const variationBonus =
    budget.boundedVariationApplied && budget.preferredProbeTarget === serverId
      ? RUNNER_PRESSURE_PROBE_VARIATION_BONUS
      : 0;
  return {
    priorityBonus: RUNNER_PRESSURE_PROBE_PRIORITY_BONUS + variationBonus,
    evidence: [
      ...budget.evidence,
      "pressure_probe_allowed:true",
      `pressure_probe_target:${serverId}`,
      `pressure_probe_variation_bonus:${variationBonus}`,
      "economy_pressure_tradeoff:probe_within_budget",
      "why_spend_allowed_despite_reserve:pressure_budget_probe",
    ],
  };
}

export function runnerRunTargetEvaluationForAction(
  context: TacticalPlanBuildContext,
  action: LegalAction,
): RunnerRunTargetEvaluation | undefined {
  return context.runnerRunTargetEvaluations?.find(
    (evaluation) => evaluation.actionId === action.actionId,
  );
}

export function runnerRunTargetCurrentStep(
  context: TacticalPlanBuildContext,
  action: LegalAction,
  defaultStep: Parameters<typeof createPlanStep>[0],
): PlanStep {
  const evaluation = runnerRunTargetEvaluationForAction(context, action);
  const preserveLastClickForScoreThreat =
    evaluation?.scoreThreat === true &&
    evaluation.pathPassability === "reachable" &&
    evaluation.creditsAfterRun >= 0 &&
    context.input.playerView.own.clicks <= 1;
  if (
    evaluation?.recommendation === "gain_credits_first" &&
    !preserveLastClickForScoreThreat
  ) {
    return createPlanStep({
      stepId: `gain_credits_before_run:${evaluation.targetServerId}`,
      kind: "gain_credits",
      desiredActionSemantics: ["economy.gain_credit"],
      rationale: [
        "run target evaluation recommends funding before pressure",
        ...runnerRunTargetStepRationale(context, action),
      ],
    });
  }
  return createPlanStep({
    ...defaultStep,
    rationale: [
      ...(defaultStep.rationale ?? []),
      ...(preserveLastClickForScoreThreat
        ? ["preserve last click for reachable remote score threat"]
        : []),
    ],
  });
}

export function runnerRunTargetPlanEvidence(
  context: TacticalPlanBuildContext,
  action: LegalAction,
): string[] {
  const evaluation = runnerRunTargetEvaluationForAction(context, action);
  const serverId = actionServerId(action);
  if (!evaluation) return runnerDeckStrategyPlanEvidence(context, serverId);
  return [
    `runner_run_target_recommendation:${evaluation.recommendation}`,
    `runner_run_target_payoff:${evaluation.accessPayoff}`,
    `runner_run_target_path:${evaluation.pathPassability}`,
    `runner_run_target_score:${evaluation.score}`,
    ...(evaluation.scoreThreat ? ["runner_run_target_score_threat:true"] : []),
    ...runnerDeckStrategyPlanEvidence(context, serverId),
    ...evaluation.evidence.filter(
      (entry) =>
        entry === "known_remote_no_current_payoff" ||
        entry === "repeated_remote_no_progress_suppressed",
    ),
  ];
}

export function runnerRunTargetStepRationale(
  context: TacticalPlanBuildContext,
  action: LegalAction,
): string[] {
  const evaluation = runnerRunTargetEvaluationForAction(context, action);
  if (!evaluation) return [];
  return [
    `RunTargetEvaluation recommends ${evaluation.recommendation}.`,
    `Access payoff is ${evaluation.accessPayoff}; path is ${evaluation.pathPassability}.`,
  ];
}

function runnerRunTargetPlanPriorityDelta(
  evaluation: RunnerRunTargetEvaluation,
): number {
  return (
    runnerRunTargetTacticalPriorityDelta(evaluation) +
    runnerScoreThreatPlanUrgencyBoost(evaluation)
  );
}

function runnerScoreThreatPlanUrgencyBoost(
  evaluation: RunnerRunTargetEvaluation,
): number {
  if (!evaluation.scoreThreat) return 0;
  return 520;
}

export function runnerDeckStrategyPlanPriorityBoost(
  context: TacticalPlanBuildContext,
  serverId: string | undefined,
): number {
  if (!serverId || !context.strategicIntentState) return 0;
  const primaryFit = runnerDeckStrategyServerFit(
    context.strategicIntentState.primaryStrategy.strategyId,
    serverId,
  );
  if (primaryFit) return primaryFit === "exact" ? 120 : 90;
  const secondaryFit = context.strategicIntentState.secondaryStrategies.some(
    (strategy) => runnerDeckStrategyServerFit(strategy.strategyId, serverId),
  );
  return secondaryFit ? 60 : 0;
}

function runnerDeckStrategyPlanScoreBreakdown(
  context: TacticalPlanBuildContext,
  serverId: string | undefined,
): PlanScoreBreakdown[] {
  const boost = runnerDeckStrategyPlanPriorityBoost(context, serverId);
  if (boost <= 0 || !context.strategicIntentState || !serverId) return [];
  return [
    {
      key: "runner_deck_strategy_plan_fit",
      label: "Deck strategy plan fit",
      value: boost,
      reason: runnerDeckStrategyPlanEvidence(context, serverId).join("|"),
    },
  ];
}

function runnerDeckStrategyPlanEvidence(
  context: TacticalPlanBuildContext,
  serverId: string | undefined,
): string[] {
  const state = context.strategicIntentState;
  if (!state || !serverId) return [];
  const primaryFit = runnerDeckStrategyServerFit(
    state.primaryStrategy.strategyId,
    serverId,
  );
  const secondaryFits = state.secondaryStrategies
    .filter((strategy) =>
      runnerDeckStrategyServerFit(strategy.strategyId, serverId),
    )
    .map((strategy) => strategy.strategyId);
  if (!primaryFit && secondaryFits.length === 0) return [];
  return [
    `deck_strategy_plan_fit_target:${serverId}`,
    ...(primaryFit
      ? [
          `deck_strategy_plan_fit_primary:${state.primaryStrategy.strategyId}`,
          `deck_strategy_plan_fit_level:${primaryFit}`,
        ]
      : []),
    ...(secondaryFits.length > 0
      ? [`deck_strategy_plan_fit_secondary:${secondaryFits.join("|")}`]
      : []),
  ];
}

function runnerDeckStrategyServerFit(
  strategyId: string,
  serverId: string,
): "exact" | "kind" | undefined {
  if (strategyId === "runner.rnd_pressure" && serverId === "rd") {
    return "exact";
  }
  if (strategyId === "runner.hq_pressure" && serverId === "hq") {
    return "exact";
  }
  if (
    (strategyId === "runner.remote_contest" ||
      strategyId === "runner.remote_trash") &&
    serverId.startsWith("remote_")
  ) {
    return "kind";
  }
  return undefined;
}
