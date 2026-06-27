import type { RunnerHandDevelopmentEvaluation } from "../runner-hand-development";
import {
  assessRunnerDrawOverflow,
  runnerHandDevelopmentOverflowBonus,
} from "./runner-draw-overflow";
import {
  createPlanStep,
  createTacticalPlan,
} from "./tactical-plan-builders";
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
        drawOverflowScore,
    ),
  );
}

export function runnerHandDevelopmentPlans(
  context: TacticalPlanBuildContext,
  stateVersion: number,
  runnerGoalEvidence: readonly string[],
): TacticalPlan[] {
  return (context.runnerHandDevelopmentEvaluations ?? [])
    .filter(usefulLegalRunnerHandDevelopment)
    .slice(0, 6)
    .map((evaluation) =>
      createTacticalPlan({
        planId: `runner.develop_hand_card:${evaluation.cardInstanceId}`,
        side: "runner",
        type: "runner.develop_hand_card",
        status: "active",
        priority: runnerHandDevelopmentPlanPriority(context, evaluation),
        horizonTurns: 1,
        target: {
          kind: "card",
          id: evaluation.cardInstanceId,
          label: runnerHandDevelopmentTargetLabel(evaluation),
        },
        currentStep: createPlanStep({
          stepId: `install_development_card:${evaluation.cardInstanceId}`,
          kind: "install_development_card",
          desiredActionSemantics: [
            "install.card",
            "play.runner_event",
            `runner_hand_development.${evaluation.developmentRole}`,
          ],
          rationale: [
            `hand development role ${evaluation.developmentRole} is ${evaluation.currentNeed}`,
            `hand development priority ${evaluation.priority}`,
          ],
        }),
        evidence: [
          `hand_development_role:${evaluation.developmentRole}`,
          `hand_development_need:${evaluation.currentNeed}`,
          `hand_development_fit:${evaluation.strategicFit}`,
          `hand_development_priority:${evaluation.priority}`,
          ...(evaluation.persistentInstallEvaluation
            ? [
                `persistent_install_stackability:${evaluation.persistentInstallEvaluation.stackabilityClass}`,
                `persistent_install_delta:${evaluation.persistentInstallEvaluation.capabilityDelta}`,
                `persistent_install_duplicate:${evaluation.persistentInstallEvaluation.duplicateRole}`,
                `persistent_install_fit:${evaluation.persistentInstallEvaluation.finalInstallFit}`,
              ]
            : []),
          ...evaluation.evidence.slice(0, 6),
          ...runnerGoalEvidence,
        ],
        scoreBreakdown: [
          {
            key: "runner_hand_development",
            label: "Runner hand development",
            value: runnerHandDevelopmentPlanPriority(context, evaluation),
            reason: evaluation.developmentRole,
          },
        ],
        stateVersion,
      }),
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
