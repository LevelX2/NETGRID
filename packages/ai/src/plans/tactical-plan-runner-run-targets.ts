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
    runnerCentralRunRelativeQualityPlanDelta(context, evaluation) +
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
  const relativeCentralQuality = runnerCentralRunRelativeQualityPlanDelta(
    context,
    evaluation,
  );
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
    ...(relativeCentralQuality !== 0 && evaluation
      ? [
          {
            key: "runner_central_run_relative_quality",
            label: "Relative Zentral-Run-Qualität",
            value: relativeCentralQuality,
            reason: [
              `target:${evaluation.targetServerId}`,
              `score:${runnerCentralRunTargetScore(context, evaluation)}`,
              `peer_scores:${runnerCentralRunPeerScores(
                context,
                evaluation.recommendation,
              ).join(",")}`,
            ].join("|"),
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
                  `path:${evaluation.pathPassability}`,
                  `path_cost:${evaluation.pathCost}`,
                  `credits_after:${evaluation.creditsAfterRun}`,
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

const RUNNER_FUNDED_MATCHPOINT_RUN_CONVERSION_PRIORITY_BOOST = 520;
const RUNNER_REACHABLE_MATCHPOINT_RUN_CONVERSION_PRIORITY_BOOST = 720;
const RUNNER_CENTRAL_RUN_RELATIVE_QUALITY_LIMIT = 240;

function runnerCentralRunRelativeQualityPlanDelta(
  context: TacticalPlanBuildContext,
  evaluation: RunnerRunTargetEvaluation | undefined,
): number {
  if (
    !evaluation ||
    (evaluation.targetKind !== "rd" && evaluation.targetKind !== "hq")
  ) {
    return 0;
  }
  const peerScores = runnerCentralRunPeerScores(
    context,
    evaluation.recommendation,
  );
  if (peerScores.length < 2) return 0;
  const targetScore = runnerCentralRunTargetScore(context, evaluation);
  const averageScore =
    peerScores.reduce((total, score) => total + score, 0) / peerScores.length;
  return Math.max(
    -RUNNER_CENTRAL_RUN_RELATIVE_QUALITY_LIMIT,
    Math.min(
      RUNNER_CENTRAL_RUN_RELATIVE_QUALITY_LIMIT,
      Math.round(targetScore - averageScore),
    ),
  );
}

function runnerCentralRunPeerScores(
  context: TacticalPlanBuildContext,
  recommendation?: RunnerRunTargetEvaluation["recommendation"],
): number[] {
  const scoreByServer = new Map<string, number>();
  for (const evaluation of context.runnerRunTargetEvaluations ?? []) {
    if (evaluation.targetKind !== "rd" && evaluation.targetKind !== "hq") {
      continue;
    }
    if (
      recommendation !== undefined &&
      evaluation.recommendation !== recommendation
    ) {
      continue;
    }
    scoreByServer.set(
      evaluation.targetServerId,
      Math.max(
        evaluation.score,
        scoreByServer.get(evaluation.targetServerId) ?? -Infinity,
      ),
    );
  }
  return [...scoreByServer.values()];
}

function runnerCentralRunTargetScore(
  context: TacticalPlanBuildContext,
  evaluation: RunnerRunTargetEvaluation,
): number {
  return Math.max(
    evaluation.score,
    ...(context.runnerRunTargetEvaluations ?? [])
      .filter(
        (candidate) =>
          candidate.targetServerId === evaluation.targetServerId &&
          candidate.recommendation === evaluation.recommendation,
      )
      .map((candidate) => candidate.score),
  );
}

function runnerMatchpointRunConversionPriorityBoost(
  context: TacticalPlanBuildContext,
  evaluation: RunnerRunTargetEvaluation | undefined,
): number {
  if (!runnerCentralMatchpointAccessOpportunity(context, evaluation)) return 0;
  if (runnerReachableCentralMatchpointRun(context, evaluation)) {
    return RUNNER_REACHABLE_MATCHPOINT_RUN_CONVERSION_PRIORITY_BOOST;
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
  return RUNNER_FUNDED_MATCHPOINT_RUN_CONVERSION_PRIORITY_BOOST;
}

function runnerCentralMatchpointAccessOpportunity(
  context: TacticalPlanBuildContext,
  evaluation: RunnerRunTargetEvaluation | undefined,
): evaluation is RunnerRunTargetEvaluation {
  if (!evaluation) return false;
  if (evaluation.targetKind !== "rd" && evaluation.targetKind !== "hq") {
    return false;
  }
  const pointsNeeded =
    context.input.playerView.agendaPointsToWin -
    context.input.playerView.own.agendaPoints;
  if (pointsNeeded > 1) return false;
  return (
    evaluation.accessPayoff === "unknown" ||
    evaluation.accessPayoff === "fresh" ||
    evaluation.accessPayoff === "access_bonus" ||
    evaluation.accessPayoff === "agenda"
  );
}

function runnerReachableCentralMatchpointRun(
  context: TacticalPlanBuildContext,
  evaluation: RunnerRunTargetEvaluation | undefined,
): boolean {
  if (!runnerCentralMatchpointAccessOpportunity(context, evaluation)) {
    return false;
  }
  if (
    evaluation.recommendation !== "run_now" &&
    evaluation.recommendation !== "run_if_free" &&
    evaluation.recommendation !== "gain_credits_first"
  ) {
    return false;
  }
  return (
    context.input.playerView.own.clicks > 0 &&
    evaluation.pathPassability === "reachable" &&
    evaluation.pathCost <= 1 &&
    evaluation.creditsAfterRun >= 0
  );
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
        runnerEvaluationUsesBasicStartRun(context, evaluation.actionId) &&
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
  const flatlineRiskLevel = runnerDamageThreatAssessment(context.input)
    .flatlineRisk.level;
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
    !allowedProbeEvaluations.some(
      (evaluation) =>
        !runnerEvaluationUsesBasicStartRun(context, evaluation.actionId),
    ) &&
    variationEligibleProbeTargets.length > 0;
  const probeDisposition = probeEligible
    ? runnerPressureProbeDisposition(
        replayStableVariationContext,
        flatlineRiskLevel,
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
  const boundedVariationApplied = probeEligible;
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
    flatlineRiskLevel,
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
      `probe_flatline_risk_level:${flatlineRiskLevel}`,
    ],
  };
}

function runnerEvaluationUsesBasicStartRun(
  context: TacticalPlanBuildContext,
  actionId: string,
): boolean {
  const action = context.input.legalActions.find(
    (candidate) => candidate.actionId === actionId,
  );
  return action?.type === "start_run" && action.source === "basic_action";
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
  const preserveReachableMatchpointRun = runnerReachableCentralMatchpointRun(
    context,
    evaluation,
  );
  const fundingHasImmediateRunValue =
    (evaluation?.score ?? 0) > 0 ||
    evaluation?.scoreThreat === true ||
    runnerCentralMatchpointAccessOpportunity(context, evaluation);
  const probeOnly =
    evaluation?.evidence.includes("run_commitment:probe_only") === true;
  const scoreThreatProbeWithoutVisibleCost =
    probeOnly && evaluation?.scoreThreat === true && evaluation.pathCost === 0;
  const usefulNonFundingActionAvailable =
    (context.input.legalActions ?? []).some(
      (candidate) => candidate.type === "draw_card",
    ) ||
    (context.runnerHandDevelopmentEvaluations ?? []).some(
      usefulLegalRunnerHandDevelopment,
    );
  const longHorizonFundingFallback =
    evaluation?.pathPassability === "blocked_unpayable" &&
    !usefulNonFundingActionAvailable;
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
    (!probeOnly || scoreThreatProbeWithoutVisibleCost) &&
    !preserveLastClickForScoreThreat &&
    !preserveReachableMatchpointRun &&
    (concreteEconomyFunding ||
      longHorizonFundingFallback ||
      (fundingHasImmediateRunValue &&
        (boundedPathFunding || urgentContestFunding)))
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
        ...(scoreThreatProbeWithoutVisibleCost
          ? ["zero-cost score-threat probe honors funding recommendation"]
          : []),
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
      ...(preserveReachableMatchpointRun
        ? ["convert reachable low-cost central run at matchpoint"]
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
