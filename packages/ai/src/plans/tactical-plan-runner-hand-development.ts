import type { RunnerHandDevelopmentEvaluation } from "../runner-hand-development";
import { cardProvidesBreakerCoverage } from "./tactical-plan-breaker-cards";
import { missingBreakerCoverageKind } from "./tactical-plan-breaker-coverage";
import {
  assessRunnerDrawOverflow,
  runnerHandDevelopmentOverflowBonus,
} from "./runner-draw-overflow";
import {
  createPlanStep,
  createTacticalPlan,
} from "./tactical-plan-builders";
import {
  runNeedsBreakerCoverage,
} from "./tactical-plan-run-reachability";
import { actionServerId } from "./tactical-plan-server-targets";
import type {
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
): TacticalPlan[] {
  const usefulEvaluations = (context.runnerHandDevelopmentEvaluations ?? [])
    .filter(usefulLegalRunnerHandDevelopment)
    .filter(
      (evaluation) =>
        !runnerHandDevelopmentOwnedByBreakerCoverage(context, evaluation),
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
  runnerGoalEvidence: readonly string[];
  stateVersion: number;
}): TacticalPlan {
  const { context, evaluation } = params;
  return createTacticalPlan({
    planId: params.planId,
    side: "runner",
    type: params.type,
    status: "active",
    priority: params.priority,
    horizonTurns: 1,
    target: {
      kind: "card",
      id: evaluation.cardInstanceId,
      label: runnerHandDevelopmentTargetLabel(evaluation),
    },
    currentStep: createPlanStep({
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
    evidence: [
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
      ...(params.extraEvidence ?? []),
      ...evaluation.evidence.slice(0, 6),
      ...params.runnerGoalEvidence,
    ],
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

function runnerHandDevelopmentOwnedByBreakerCoverage(
  context: TacticalPlanBuildContext,
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  if (evaluation.developmentRole !== "breaker_or_rig_piece") return false;
  if (!evaluation.legalActionId) return false;
  const legalAction = context.input.legalActions.find(
    (action) => action.actionId === evaluation.legalActionId,
  );
  if (!legalAction || legalAction.type !== "install_card") return false;
  if (!runnerLegalActionReferencesCard(legalAction, evaluation.cardInstanceId)) {
    return false;
  }
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

function runnerLegalActionReferencesCard(
  action: { source?: string; payload?: Record<string, unknown> },
  cardId: string,
): boolean {
  const payload = action.payload ?? {};
  return (
    action.source === cardId ||
    payload.cardId === cardId ||
    payload.sourceCardId === cardId ||
    payload.targetCardId === cardId ||
    payload.selectedCardId === cardId
  );
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
