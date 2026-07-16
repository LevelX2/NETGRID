import type { LegalAction } from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import {
  runnerPressurePreferredProbeTarget,
  runnerPressureProbeDisposition,
  runnerPressureVariationBucket,
  runnerPressureProbeBasePriority,
  runnerPressureProbeTargetAllowed,
  runnerRunTargetTacticalPriorityDelta,
} from "../runner-run-target-guidance";
import { runnerDamageThreatAssessment } from "../runner-damage-threat-assessment";
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
    runnerMatchpointRunConversionPriorityBoost(context, evaluation) +
    runnerEconomyTransitionRunPriorityDelta(context, evaluation) +
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
    ...(runnerEconomyTransitionRunPriorityDelta(context, evaluation) !== 0
      ? [
          {
            key: "runner_economy_transition_run_deferral",
            label: "Ökonomie-Transition",
            value: runnerEconomyTransitionRunPriorityDelta(context, evaluation),
            reason:
              context.runnerEconomyPosture?.transition?.commitment ?? "none",
          },
        ]
      : []),
    ...(runnerMatchpointRunConversionPriorityBoost(context, evaluation) !== 0
      ? [
          {
            key: "runner_matchpoint_run_conversion",
            label: "Matchpoint-Run-Konvertierung",
            value: runnerMatchpointRunConversionPriorityBoost(
              context,
              evaluation,
            ),
            reason: evaluation
              ? [
                  `target:${evaluation.targetServerId}`,
                  `funding_gap:${Math.max(0, -evaluation.creditsAfterRun)}`,
                  `clicks:${context.input.playerView.own.clicks}`,
                  `payoff:${evaluation.accessPayoff}`,
                ].join("|")
              : "missing_evaluation",
          },
        ]
      : []),
    ...runnerDeckStrategyPlanScoreBreakdown(context, actionServerId(action)),
  ];
}

const RUNNER_MATCHPOINT_RUN_CONVERSION_PRIORITY_BOOST = 520;

function runnerMatchpointRunConversionPriorityBoost(
  context: TacticalPlanBuildContext,
  evaluation: RunnerRunTargetEvaluation | undefined,
): number {
  if (!evaluation) return 0;
  if (evaluation.targetKind !== "rd" && evaluation.targetKind !== "hq")
    return 0;
  const pointsNeeded =
    context.input.playerView.agendaPointsToWin -
    context.input.playerView.own.agendaPoints;
  if (pointsNeeded > 1) return 0;
  if (
    evaluation.accessPayoff !== "unknown" &&
    evaluation.accessPayoff !== "fresh" &&
    evaluation.accessPayoff !== "access_bonus" &&
    evaluation.accessPayoff !== "agenda"
  ) {
    return 0;
  }
  if (
    evaluation.recommendation !== "gain_credits_first" ||
    evaluation.pathPassability !== "blocked_unpayable"
  ) {
    return 0;
  }
  const fundingGap = Math.max(0, -evaluation.creditsAfterRun);
  const preparatoryClicks = Math.max(
    0,
    context.input.playerView.own.clicks - 1,
  );
  if (fundingGap === 0 || fundingGap > preparatoryClicks) return 0;
  return RUNNER_MATCHPOINT_RUN_CONVERSION_PRIORITY_BOOST;
}

function runnerEconomyTransitionRunPriorityDelta(
  context: TacticalPlanBuildContext,
  evaluation: RunnerRunTargetEvaluation | undefined,
): number {
  if (
    context.runnerEconomyPosture?.transition?.ordinaryPaidRunsDeferred !==
      true ||
    !evaluation ||
    evaluation.pathCost <= 1 ||
    evaluation.scoreThreat ||
    evaluation.accessPayoff === "agenda" ||
    evaluation.accessPayoff === "score_threat"
  ) {
    return 0;
  }
  return -520;
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
  const variationEligibleProbeTargets = allowedProbeEvaluations
    .filter(
      (evaluation) =>
        evaluation.accessPayoff === "unknown" &&
        evaluation.knownAccessState === "unknown" &&
        evaluation.scoreThreat !== true,
    )
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
  const damageThreatLevel = runnerDamageThreatAssessment(context.input).level;
  const replayStableVariationContext = [
    context.input.seed,
    context.input.decisionId,
    context.input.actionNumber,
    context.input.playerView.stateVersion,
    allowedProbeTargets.join("|"),
  ].join(":");
  const probeEligible =
    context.input.side === "runner" &&
    reservePressureActive &&
    !usefulHandDevelopmentAvailable &&
    !remoteFundingNeed &&
    variationEligibleProbeTargets.length > 0;
  const probeDisposition = probeEligible
    ? runnerPressureProbeDisposition(
        replayStableVariationContext,
        damageThreatLevel,
      )
    : "hold";
  const variationBucket = runnerPressureVariationBucket(
    `${replayStableVariationContext}|disposition`,
    4,
  );
  const blockedReasons = [
    ...(!reservePressureActive ? ["reserve_pressure_inactive"] : []),
    ...(usefulHandDevelopmentAvailable
      ? ["useful_hand_development_available"]
      : []),
    ...(remoteFundingNeed ? ["remote_contest_funding_need"] : []),
    ...(allowedProbeTargets.length === 0 ? ["no_safe_probe_target"] : []),
    ...(probeEligible && probeDisposition === "hold"
      ? ["replay_stable_safe_probe_hold"]
      : []),
  ];
  const canSpendActionOnPressure =
    probeEligible && probeDisposition === "probe";
  const boundedVariationApplied =
    probeEligible;
  const preferredProbeTarget =
    canSpendActionOnPressure && nearTieProbeTargets.length > 1
    ? runnerPressurePreferredProbeTarget(
        nearTieProbeTargets,
        replayStableVariationContext,
      )
    : undefined;
  const variationReason = boundedVariationApplied
    ? "safe_probe_seeded_decision_context"
    : "deterministic_priority_only";
  return {
    canSpendActionOnPressure,
    pressureActionBudgetThisTurn: canSpendActionOnPressure ? 1 : 0,
    maxCreditLossForProbe: 0,
    allowedProbeTargets,
    nearTieProbeTargets,
    variationEligibleProbeTargets,
    ...(preferredProbeTarget ? { preferredProbeTarget } : {}),
    blockedReasons,
    boundedVariationApplied,
    variationReason,
    probeDisposition,
    variationBucket,
    damageThreatLevel,
    evidence: [
      `pressure_budget:${canSpendActionOnPressure ? "available" : "blocked"}`,
      `pressure_action_budget:${canSpendActionOnPressure ? 1 : 0}`,
      "max_credit_loss_for_probe:0",
      `allowed_probe_targets:${allowedProbeTargets.join("|") || "none"}`,
      `near_tie_probe_targets:${nearTieProbeTargets.join("|") || "none"}`,
      `variation_eligible_probe_targets:${variationEligibleProbeTargets.join("|") || "none"}`,
      `preferred_probe_target:${preferredProbeTarget ?? "none"}`,
      `blocked_pressure_reasons:${blockedReasons.join("|") || "none"}`,
      `bounded_variation_applied:${boundedVariationApplied}`,
      `variation_reason:${variationReason}`,
      `probe_disposition:${probeDisposition}`,
      `probe_variation_bucket:${variationBucket}`,
      `probe_damage_threat_level:${damageThreatLevel}`,
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
  const fundingGap = Math.max(0, -(evaluation?.creditsAfterRun ?? 0));
  const preparatoryClicks = Math.max(
    0,
    context.input.playerView.own.clicks - 1,
  );
  const boundedPathFunding =
    evaluation?.pathPassability === "blocked_unpayable" &&
    fundingGap > 0 &&
    fundingGap <= preparatoryClicks;
  const urgentContestFunding =
    evaluation?.scoreThreat === true &&
    evaluation.pathPassability === "reachable" &&
    evaluation.creditsAfterRun >= 0 &&
    preparatoryClicks > 0;
  const concreteEconomyFunding =
    context.runnerEconomyPosture?.fundingNeed === true &&
    context.input.playerView.own.credits <
      context.runnerEconomyPosture.desiredCreditReserve;
  if (evaluation?.recommendation === "draw_for_damage_buffer") {
    return createPlanStep({
      stepId: `draw_hand_buffer_before_run:${evaluation.targetServerId}`,
      kind: "draw_hand_buffer",
      desiredActionSemantics: ["draw.card"],
      rationale: [
        "probabilistic universal coverage needs a survivable hand buffer",
        ...(evaluation.blinkRiskAssessment?.evidence ?? []),
      ],
    });
  }
  if (
    evaluation?.recommendation === "gain_credits_first" &&
    !preserveLastClickForScoreThreat &&
    (boundedPathFunding || urgentContestFunding || concreteEconomyFunding)
  ) {
    return createPlanStep({
      stepId: `gain_credits_before_run:${evaluation.targetServerId}`,
      kind: "gain_credits",
      desiredActionSemantics: ["economy.gain_credit"],
      rationale: [
        "run target evaluation recommends funding before pressure",
        `run funding gap ${fundingGap}`,
        `run preparatory clicks ${preparatoryClicks}`,
        `concrete economy funding ${concreteEconomyFunding}`,
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
