import type { RunnerHandDevelopmentEvaluation } from "../runner-hand-development";
import { cardProvidesBreakerCoverage } from "./tactical-plan-breaker-cards";
import { missingBreakerCoverageKind } from "./tactical-plan-breaker-coverage";
import {
  assessRunnerDrawOverflow,
  runnerHandDevelopmentOverflowBonus,
} from "./runner-draw-overflow";
import {
  legalActionCreditGainForPlan,
  type TacticalPlanCreditValueDependencies,
} from "./tactical-plan-action-values";
import {
  createPlanStep,
  createTacticalPlan,
} from "./tactical-plan-builders";
import {
  runNeedsBreakerCoverage,
} from "./tactical-plan-run-reachability";
import { actionServerId } from "./tactical-plan-server-targets";
import type {
  PlanBlocker,
  PlanLifecycle,
  PlanStep,
  RequiredCapability,
  TacticalPlan,
  TacticalPlanBuildContext,
} from "./tactical-plan-types";

export function runnerHandDevelopmentTargetLabel(
  evaluation: RunnerHandDevelopmentEvaluation,
): string {
  return evaluation.title ?? evaluation.definitionId ?? evaluation.developmentRole;
}

export function usefulLegalRunnerHandDevelopment(
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  if (evaluation.availability !== "legal_now") return false;
  if (!evaluation.legalActionId) return false;
  if (
    evaluation.persistentInstallEvaluation &&
    (evaluation.persistentInstallEvaluation.finalInstallFit <= 0 ||
      evaluation.persistentInstallEvaluation.duplicateRole ===
        "redundant_duplicate")
  ) {
    return false;
  }
  if (
    evaluation.developmentRole === "duplicate_or_low_value" ||
    evaluation.developmentRole === "unknown"
  ) {
    return false;
  }
  if (evaluation.currentNeed === "none" || evaluation.currentNeed === "later") {
    return false;
  }
  if (
    evaluation.developmentRole === "defense_support" &&
    evaluation.currentNeed !== "acute"
  ) {
    return false;
  }
  return evaluation.priority >= 500;
}

export function usefulFundableRunnerHandDevelopment(
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  if (evaluation.availability !== "missing_credits") return false;
  if (!evaluation.fundingNeed) return false;
  if (
    evaluation.persistentInstallEvaluation &&
    (evaluation.persistentInstallEvaluation.finalInstallFit <= 0 ||
      evaluation.persistentInstallEvaluation.duplicateRole ===
        "redundant_duplicate")
  ) {
    return false;
  }
  if (
    evaluation.developmentRole === "duplicate_or_low_value" ||
    evaluation.developmentRole === "unknown"
  ) {
    return false;
  }
  if (evaluation.currentNeed === "none" || evaluation.currentNeed === "later") {
    return false;
  }
  if (
    evaluation.developmentRole === "defense_support" &&
    evaluation.currentNeed !== "acute"
  ) {
    return false;
  }
  return evaluation.priority >= 500;
}

function deferredLegalRunnerHandDevelopment(
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  if (evaluation.availability !== "legal_now") return false;
  if (!evaluation.legalActionId) return false;
  if (
    evaluation.developmentRole === "duplicate_or_low_value" ||
    evaluation.developmentRole === "unknown"
  ) {
    return false;
  }
  if (evaluation.currentNeed === "none" || evaluation.currentNeed === "later") {
    return false;
  }
  if (
    evaluation.developmentRole === "defense_support" &&
    evaluation.currentNeed !== "acute"
  ) {
    return false;
  }
  if (
    evaluation.persistentInstallEvaluation?.duplicateRole ===
    "redundant_duplicate"
  ) {
    return false;
  }
  return (
    evaluation.priority >= 300 ||
    (evaluation.persistentInstallEvaluation !== undefined &&
      evaluation.persistentInstallEvaluation.finalInstallFit <= 0)
  );
}

export function runnerHandDevelopmentPlanPriority(
  context: TacticalPlanBuildContext,
  evaluation: RunnerHandDevelopmentEvaluation,
): number {
  const creditBase = context.runnerEconomyPosture?.creditBasePlan;
  const drawOverflow = assessRunnerDrawOverflow(context);
  const roleScore = runnerHandDevelopmentRolePriority(evaluation);
  const needScore = runnerHandDevelopmentNeedPriority(evaluation);
  const fitScore = runnerHandDevelopmentFitPriority(evaluation);
  const installFitScore =
    evaluation.persistentInstallEvaluation !== undefined
      ? Math.min(
          0,
          Math.round(evaluation.persistentInstallEvaluation.finalInstallFit / 4),
        )
      : 0;
  const creditBaseScore =
    creditBase?.recommendation === "allow_setup_spend" ? 40 :
    creditBase?.recommendation === "preserve_reserve" ? -40 :
    0;
  const economyRouteScore = runnerEconomyRouteDevelopmentScore(
    context,
    evaluation,
  );
  const drawOverflowScore = runnerHandDevelopmentOverflowBonus(drawOverflow);
  return Math.max(
    0,
    Math.min(
      960,
      roleScore +
        needScore +
        fitScore +
        installFitScore +
        creditBaseScore +
        economyRouteScore +
        drawOverflowScore,
    ),
  );
}

export function runnerHandDevelopmentPlans(
  context: TacticalPlanBuildContext,
  stateVersion: number,
  runnerGoalEvidence: readonly string[],
  dependencies: TacticalPlanCreditValueDependencies,
): TacticalPlan[] {
  const handEvaluations = context.runnerHandDevelopmentEvaluations ?? [];
  const usefulEvaluations = handEvaluations
    .filter(usefulLegalRunnerHandDevelopment)
    .filter(
      (evaluation) =>
        !runnerHandDevelopmentOwnedByBreakerCoverage(context, evaluation),
    );
  const canFundHandCardsNow = runnerHandFundingActionAvailable(
    context,
    dependencies,
  );
  const fundableEvaluations = canFundHandCardsNow
    ? handEvaluations
        .filter(usefulFundableRunnerHandDevelopment)
        .filter(
          (evaluation) =>
            !runnerHandDevelopmentOwnedByBreakerCoverage(context, evaluation),
        )
    : [];
  const deferredEvaluations = handEvaluations
    .filter(
      (evaluation) =>
        !usefulLegalRunnerHandDevelopment(evaluation) &&
        !usefulFundableRunnerHandDevelopment(evaluation) &&
        deferredLegalRunnerHandDevelopment(evaluation),
    )
    .filter(
      (evaluation) =>
        !runnerHandDevelopmentOwnedByBreakerCoverage(context, evaluation),
    )
    .sort(
      (left, right) =>
        runnerHandDevelopmentPlanPriority(context, right) -
          runnerHandDevelopmentPlanPriority(context, left) ||
        right.priority - left.priority ||
        left.cardInstanceId.localeCompare(right.cardInstanceId),
    );
  const bestEvaluation = runnerBestHandCardEvaluation(context, usefulEvaluations);
  const bestPriority = bestEvaluation
    ? runnerPlayBestHandCardPlanPriority(context, bestEvaluation)
    : undefined;
  const plans: TacticalPlan[] = [];
  if (bestEvaluation) {
    plans.push(
      runnerHandDevelopmentPlan({
        context,
        evaluation: bestEvaluation,
        type: "runner.play_best_hand_card",
        planId: `runner.play_best_hand_card:${bestEvaluation.cardInstanceId}`,
        stepId: `play_best_hand_card:${bestEvaluation.cardInstanceId}`,
        priority: bestPriority ?? 0,
        scoreKey: "runner_play_best_hand_card",
        scoreLabel: "Runner best hand card",
        extraDesiredSemantics: ["runner_hand.best_card"],
        extraRationale: ["play the best currently useful legal hand card"],
        extraEvidence: [
          "best_hand_card_plan:true",
          `best_hand_card_role:${bestEvaluation.developmentRole}`,
          `best_hand_card_need:${bestEvaluation.currentNeed}`,
          `best_hand_card_priority:${bestEvaluation.priority}`,
          `best_hand_card_candidate_count:${usefulEvaluations.length}`,
        ],
        runnerGoalEvidence,
        stateVersion,
      }),
    );
  }
  const secondaryPriorityCeiling =
    bestPriority !== undefined ? Math.max(0, bestPriority - 20) : undefined;
  plans.push(
    ...usefulEvaluations
      .filter(
        (evaluation) =>
          evaluation.cardInstanceId !== bestEvaluation?.cardInstanceId,
      )
      .slice(0, bestEvaluation ? 5 : 6)
      .map((evaluation) =>
        runnerHandDevelopmentPlan({
          context,
          evaluation,
          type: "runner.develop_hand_card",
          planId: `runner.develop_hand_card:${evaluation.cardInstanceId}`,
          stepId: `install_development_card:${evaluation.cardInstanceId}`,
          priority:
            secondaryPriorityCeiling !== undefined
              ? Math.min(
                  runnerHandDevelopmentPlanPriority(context, evaluation),
                  secondaryPriorityCeiling,
                )
              : runnerHandDevelopmentPlanPriority(context, evaluation),
          scoreKey: "runner_hand_development",
          scoreLabel: "Runner hand development",
          runnerGoalEvidence,
          stateVersion,
        }),
      ),
  );
  plans.push(
    ...fundableEvaluations.slice(0, 6).map((evaluation) =>
      runnerHandFundingPlan({
        context,
        evaluation,
        runnerGoalEvidence,
        stateVersion,
      }),
    ),
  );
  plans.push(
    ...deferredEvaluations.slice(0, 4).map((evaluation) =>
      runnerDeferredHandDevelopmentPlan({
        context,
        evaluation,
        runnerGoalEvidence,
        stateVersion,
      }),
    ),
  );
  return plans;
}

function runnerHandDevelopmentPlan(params: {
  context: TacticalPlanBuildContext;
  evaluation: RunnerHandDevelopmentEvaluation;
  type: "runner.develop_hand_card" | "runner.play_best_hand_card";
  planId: string;
  stepId: string;
  priority: number;
  scoreKey: string;
  scoreLabel: string;
  extraDesiredSemantics?: readonly string[];
  extraRationale?: readonly string[];
  extraEvidence?: readonly string[];
  requiredCapabilities?: readonly RequiredCapability[];
  blockers?: readonly PlanBlocker[];
  status?: PlanLifecycle;
  currentStep?: PlanStep;
  nextSteps?: readonly PlanStep[];
  runnerGoalEvidence: readonly string[];
  stateVersion: number;
}): TacticalPlan {
  const { context, evaluation } = params;
  return createTacticalPlan({
    planId: params.planId,
    side: "runner",
    type: params.type,
    status: params.status ?? "active",
    priority: params.priority,
    horizonTurns: 1,
    target: {
      kind: "card",
      id: evaluation.cardInstanceId,
      label: runnerHandDevelopmentTargetLabel(evaluation),
    },
    requiredCapabilities: [...(params.requiredCapabilities ?? [])],
    blockers: [...(params.blockers ?? [])],
    currentStep:
      params.currentStep ??
      createPlanStep({
        stepId: params.stepId,
        kind: "install_development_card",
        desiredActionSemantics: [
          "install.card",
          "play.runner_event",
          `runner_hand_development.${evaluation.developmentRole}`,
          ...(params.extraDesiredSemantics ?? []),
        ],
        rationale: [
          `hand development role ${evaluation.developmentRole} is ${evaluation.currentNeed}`,
          `hand development priority ${evaluation.priority}`,
          ...(params.extraRationale ?? []),
        ],
      }),
    nextSteps: [...(params.nextSteps ?? [])],
    evidence: runnerHandDevelopmentPlanEvidence(
      context,
      evaluation,
      params.extraEvidence ?? [],
      params.runnerGoalEvidence,
    ),
    scoreBreakdown: [
      {
        key: params.scoreKey,
        label: params.scoreLabel,
        value: params.priority,
        reason: evaluation.developmentRole,
      },
    ],
    stateVersion: params.stateVersion,
  });
}

function runnerDeferredHandDevelopmentPlan(params: {
  context: TacticalPlanBuildContext;
  evaluation: RunnerHandDevelopmentEvaluation;
  runnerGoalEvidence: readonly string[];
  stateVersion: number;
}): TacticalPlan {
  const { context, evaluation } = params;
  return runnerHandDevelopmentPlan({
    context,
    evaluation,
    type: "runner.develop_hand_card",
    status: "abandoned",
    planId: `runner.develop_hand_card:${evaluation.cardInstanceId}`,
    stepId: `deferred_hand_card:${evaluation.cardInstanceId}`,
    priority: runnerHandDevelopmentPlanPriority(context, evaluation),
    scoreKey: "runner_hand_development_deferred",
    scoreLabel: "Runner hand development deferred",
    blockers: [runnerHandDevelopmentDeferredBlocker(evaluation)],
    extraRationale: [
      "hand card has useful text but the current install route is deferred",
      `hand development defer reason ${evaluation.deferReason}`,
    ],
    extraEvidence: [
      "hand_card_deferred_plan:true",
      `hand_card_deferred_reason:${evaluation.deferReason}`,
      ...(evaluation.persistentInstallEvaluation
        ? [
            `hand_card_deferred_install_fit:${evaluation.persistentInstallEvaluation.finalInstallFit}`,
            `hand_card_deferred_mu_penalty:${evaluation.persistentInstallEvaluation.muPressurePenalty}`,
            `hand_card_deferred_displacement_penalty:${evaluation.persistentInstallEvaluation.displacementPenalty}`,
          ]
        : []),
    ],
    runnerGoalEvidence: params.runnerGoalEvidence,
    stateVersion: params.stateVersion,
  });
}

function runnerHandFundingPlan(params: {
  context: TacticalPlanBuildContext;
  evaluation: RunnerHandDevelopmentEvaluation;
  runnerGoalEvidence: readonly string[];
  stateVersion: number;
}): TacticalPlan {
  const { context, evaluation } = params;
  const fundingNeed = evaluation.fundingNeed;
  const missingCredits = fundingNeed?.missingCredits ?? 0;
  const requiredCredits = fundingNeed?.installOrPlayCost ?? 0;
  const fundingReason = fundingNeed?.reason ?? "unknown";
  const target = {
    kind: "card" as const,
    id: evaluation.cardInstanceId,
    label: runnerHandDevelopmentTargetLabel(evaluation),
  };
  const priority = runnerHandFundingPlanPriority(context, evaluation);
  return runnerHandDevelopmentPlan({
    context,
    evaluation,
    type: "runner.develop_hand_card",
    planId: `runner.develop_hand_card:${evaluation.cardInstanceId}`,
    stepId: `fund_hand_card:${evaluation.cardInstanceId}`,
    priority,
    scoreKey: "runner_hand_development_funding",
    scoreLabel: "Runner hand development funding",
    requiredCapabilities: [
      {
        capabilityId: `credits_for_hand_card:${evaluation.cardInstanceId}`,
        kind: "credits",
        side: "runner",
        target,
        minimumCredits: requiredCredits,
        evidence: [
          `funding_missing_credits:${missingCredits}`,
          `funding_reason:${fundingReason}`,
        ],
      },
    ],
    blockers: [
      {
        blockerId: `missing_credits:${evaluation.cardInstanceId}`,
        kind: "missing_credits",
        severity: "soft",
        target,
        removalStepKind: "gain_credits",
        evidence: [
          `funding_missing_credits:${missingCredits}`,
          `funding_required_credits:${requiredCredits}`,
          `funding_reason:${fundingReason}`,
        ],
      },
    ],
    currentStep: createPlanStep({
      stepId: `gain_credits_for_hand_card:${evaluation.cardInstanceId}`,
      kind: "gain_credits",
      desiredActionSemantics: ["economy.gain_credit"],
      rationale: [
        `fund hand card ${runnerHandDevelopmentTargetLabel(evaluation)}`,
        `hand development role ${evaluation.developmentRole} is ${evaluation.currentNeed}`,
        `missing credits ${missingCredits}`,
      ],
    }),
    nextSteps: [
      createPlanStep({
        stepId: `install_development_card:${evaluation.cardInstanceId}`,
        kind: "install_development_card",
        desiredActionSemantics: [
          "install.card",
          "play.runner_event",
          `runner_hand_development.${evaluation.developmentRole}`,
        ],
        rationale: [
          "install or play the funded hand card after the credit gap closes",
        ],
      }),
    ],
    extraEvidence: [
      "hand_card_funding_plan:true",
      `funding_missing_credits:${missingCredits}`,
      `funding_required_credits:${requiredCredits}`,
      `funding_reason:${fundingReason}`,
    ],
    runnerGoalEvidence: params.runnerGoalEvidence,
    stateVersion: params.stateVersion,
  });
}

function runnerHandFundingActionAvailable(
  context: TacticalPlanBuildContext,
  dependencies: TacticalPlanCreditValueDependencies,
): boolean {
  return context.input.legalActions.some(
    (action) =>
      legalActionCreditGainForPlan(context.input, action, dependencies) > 0,
  );
}

function runnerHandDevelopmentPlanEvidence(
  context: TacticalPlanBuildContext,
  evaluation: RunnerHandDevelopmentEvaluation,
  extraEvidence: readonly string[],
  runnerGoalEvidence: readonly string[],
): string[] {
  return [
    `hand_development_role:${evaluation.developmentRole}`,
    `hand_development_need:${evaluation.currentNeed}`,
    `hand_development_fit:${evaluation.strategicFit}`,
    `hand_development_priority:${evaluation.priority}`,
    ...runnerEconomyRouteDevelopmentEvidence(context, evaluation),
    ...(evaluation.persistentInstallEvaluation
      ? [
          `persistent_install_stackability:${evaluation.persistentInstallEvaluation.stackabilityClass}`,
          `persistent_install_delta:${evaluation.persistentInstallEvaluation.capabilityDelta}`,
          `persistent_install_duplicate:${evaluation.persistentInstallEvaluation.duplicateRole}`,
          `persistent_install_fit:${evaluation.persistentInstallEvaluation.finalInstallFit}`,
        ]
      : []),
    ...extraEvidence,
    ...evaluation.evidence.slice(0, 6),
    ...runnerGoalEvidence,
  ];
}

function runnerHandDevelopmentDeferredBlocker(
  evaluation: RunnerHandDevelopmentEvaluation,
): PlanBlocker {
  const target = {
    kind: "card" as const,
    id: evaluation.cardInstanceId,
    label: runnerHandDevelopmentTargetLabel(evaluation),
  };
  const persistent = evaluation.persistentInstallEvaluation;
  if (
    evaluation.deferReason === "missing_mu" ||
    (persistent &&
      (persistent.muPressurePenalty < 0 ||
        persistent.displacementPenalty < 0))
  ) {
    return {
      blockerId: `deferred_hand_card_mu:${evaluation.cardInstanceId}`,
      kind: "missing_mu",
      severity: "soft",
      target,
      removalStepKind: "resolve_missing_mu",
      evidence: [
        `hand_development_defer_reason:${evaluation.deferReason}`,
        ...(persistent
          ? [
              `mu_pressure_penalty:${persistent.muPressurePenalty}`,
              `displacement_penalty:${persistent.displacementPenalty}`,
            ]
          : []),
      ],
    };
  }
  if (
    evaluation.deferReason === "preserve_credit_floor" ||
    evaluation.fundingNeed
  ) {
    return {
      blockerId: `deferred_hand_card_credits:${evaluation.cardInstanceId}`,
      kind: "too_expensive",
      severity: "soft",
      target,
      removalStepKind: "gain_credits",
      evidence: [
        `hand_development_defer_reason:${evaluation.deferReason}`,
        ...(evaluation.fundingNeed
          ? [
              `funding_missing_credits:${evaluation.fundingNeed.missingCredits}`,
              `funding_required_credits:${evaluation.fundingNeed.installOrPlayCost}`,
            ]
          : []),
        ...(persistent
          ? [`reserve_penalty:${persistent.reservePenalty}`]
          : []),
      ],
    };
  }
  return {
    blockerId: `deferred_hand_card_route:${evaluation.cardInstanceId}`,
    kind: "target_unreachable",
    severity: "soft",
    target,
    evidence: [
      `hand_development_defer_reason:${evaluation.deferReason}`,
      ...(persistent
        ? [`final_install_fit:${persistent.finalInstallFit}`]
        : []),
    ],
  };
}

function runnerBestHandCardEvaluation(
  context: TacticalPlanBuildContext,
  evaluations: readonly RunnerHandDevelopmentEvaluation[],
): RunnerHandDevelopmentEvaluation | undefined {
  return [...evaluations].sort(
    (left, right) =>
      runnerPlayBestHandCardPlanPriority(context, right) -
        runnerPlayBestHandCardPlanPriority(context, left) ||
      right.priority - left.priority ||
      left.developmentRole.localeCompare(right.developmentRole) ||
      left.cardInstanceId.localeCompare(right.cardInstanceId),
  )[0];
}

function runnerPlayBestHandCardPlanPriority(
  context: TacticalPlanBuildContext,
  evaluation: RunnerHandDevelopmentEvaluation,
): number {
  const planPriority = runnerHandDevelopmentPlanPriority(context, evaluation);
  const minimumPriority = runnerDevelopmentIsEconomyRoute(evaluation)
    ? 740
    : evaluation.currentNeed === "acute"
      ? 780
      : 680;
  const maximumPriority =
    evaluation.currentNeed === "acute" ||
    context.runnerEconomyPosture?.buildEconomyBeforePressure
      ? 890
      : 870;
  return Math.max(minimumPriority, Math.min(maximumPriority, planPriority));
}

function runnerHandFundingPlanPriority(
  context: TacticalPlanBuildContext,
  evaluation: RunnerHandDevelopmentEvaluation,
): number {
  const planPriority = runnerHandDevelopmentPlanPriority(context, evaluation);
  const missingCredits = evaluation.fundingNeed?.missingCredits ?? 0;
  const missingCreditDrag = Math.min(80, Math.max(0, missingCredits - 1) * 15);
  const economyRoute = runnerDevelopmentIsEconomyRoute(evaluation);
  const creditBase = context.runnerEconomyPosture?.creditBasePlan;
  const economyFundingBoost =
    economyRoute && creditBase?.recommendation === "fund_useful_hand_card"
      ? 50
      : 0;
  const minimumPriority = economyRoute
    ? 780
    : evaluation.currentNeed === "acute"
      ? 800
      : 700;
  const maximumPriority = economyRoute
    ? 960
    : evaluation.currentNeed === "acute"
      ? 920
      : 900;
  return Math.max(
    minimumPriority,
    Math.min(
      maximumPriority,
      planPriority + economyFundingBoost - missingCreditDrag,
    ),
  );
}

function runnerHandDevelopmentOwnedByBreakerCoverage(
  context: TacticalPlanBuildContext,
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  if (evaluation.developmentRole !== "breaker_or_rig_piece") return false;
  const handCard = context.input.playerView.own.gripOrHq.find(
    (card) =>
      card.known !== false && card.instanceId === evaluation.cardInstanceId,
  );
  if (!handCard) return false;
  return context.input.legalActions.some((action) => {
    if (action.type !== "start_run") return false;
    const serverId = actionServerId(action);
    if (!runNeedsBreakerCoverage(context.input.playerView, serverId)) {
      return false;
    }
    return cardProvidesBreakerCoverage(
      handCard,
      missingBreakerCoverageKind(context.input.playerView, serverId!),
    );
  });
}

function runnerEconomyRouteDevelopmentScore(
  context: TacticalPlanBuildContext,
  evaluation: RunnerHandDevelopmentEvaluation,
): number {
  if (!runnerDevelopmentIsEconomyRoute(evaluation)) return 0;
  const posture = context.runnerEconomyPosture;
  const creditBase = posture?.creditBasePlan;
  let score = 0;
  if (posture?.preferredEconomyRoute === "hand_bank_tool") {
    score += evaluation.developmentRole === "bank_tool" ? 170 : 90;
  } else if (posture?.preferredEconomyRoute === "hand_economy_engine") {
    score += evaluation.developmentRole === "economy_engine" ? 170 : 90;
  }
  if (posture?.buildEconomyBeforePressure) score += 70;
  if (posture?.recommendation === "build_economy") score += 90;
  if (creditBase?.recommendation === "fund_useful_hand_card") score += 80;
  if (creditBase?.economyPriority === "high") score += 70;
  else if (creditBase?.economyPriority === "medium") score += 35;
  return Math.min(260, score);
}

function runnerEconomyRouteDevelopmentEvidence(
  context: TacticalPlanBuildContext,
  evaluation: RunnerHandDevelopmentEvaluation,
): string[] {
  if (!runnerDevelopmentIsEconomyRoute(evaluation)) return [];
  const posture = context.runnerEconomyPosture;
  const creditBase = posture?.creditBasePlan;
  return [
    `economy_route:${posture?.preferredEconomyRoute ?? "unknown"}`,
    `economy_route_build_before_pressure:${posture?.buildEconomyBeforePressure === true}`,
    `economy_route_recommendation:${posture?.recommendation ?? "unknown"}`,
    `economy_route_creditbase:${creditBase?.recommendation ?? "unknown"}`,
    `economy_route_creditbase_priority:${creditBase?.economyPriority ?? "unknown"}`,
  ];
}

function runnerDevelopmentIsEconomyRoute(
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  return (
    evaluation.developmentRole === "economy_engine" ||
    evaluation.developmentRole === "bank_tool"
  );
}

function runnerHandDevelopmentRolePriority(
  evaluation: RunnerHandDevelopmentEvaluation,
): number {
  switch (evaluation.developmentRole) {
    case "breaker_or_rig_piece":
      return 780;
    case "memory_support":
      return 760;
    case "access_payoff":
      return 750;
    case "economy_engine":
    case "bank_tool":
      return 730;
    case "draw_or_search_engine":
      return 700;
    case "run_event":
      return 680;
    case "defense_support":
      return evaluation.currentNeed === "acute" ? 780 : 420;
    case "duplicate_or_low_value":
    case "unknown":
      return 0;
  }
}

function runnerHandDevelopmentNeedPriority(
  evaluation: RunnerHandDevelopmentEvaluation,
): number {
  switch (evaluation.currentNeed) {
    case "acute":
      return 110;
    case "useful_now":
      return 80;
    case "setup":
      return 40;
    case "later":
      return -180;
    case "none":
      return -420;
  }
}

function runnerHandDevelopmentFitPriority(
  evaluation: RunnerHandDevelopmentEvaluation,
): number {
  switch (evaluation.strategicFit) {
    case "strong":
      return 60;
    case "medium":
      return 20;
    case "blocked":
      return -80;
    case "weak":
      return -220;
  }
}
