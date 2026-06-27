import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import type { RunnerTacticalGoal } from "../runner-tactical-goals";

export type RunnerSourceCardAnswerRole = "search" | "draw";

export type RunnerRunActionSpendingCapAssessment = {
  ok: boolean;
  reason: string;
  visibleBreakCost: number;
};

export type RunnerGoalFitScoreDependencies = {
  sourceCardAnswerRole: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerSourceCardAnswerRole | undefined;
  runActionSpendingCapAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerRunActionSpendingCapAssessment;
  runTargetEvaluationForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerRunTargetEvaluation | undefined;
};

export function runnerSemanticGoalFitScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  dependencies: RunnerGoalFitScoreDependencies,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  if (
    scopeId === "tag_removal" &&
    input.playerView.own.tags > 0 &&
    (action.type === "remove_tag" ||
      actionSemanticCandidate?.semanticActionType === "tag.remove")
  ) {
    return {
      key: "runner_goal_fit_tag_removal",
      label: "Tag-Zielerfuellung",
      value: 900,
      reason: `tags:${input.playerView.own.tags}`,
    };
  }
  const sourceRole = dependencies.sourceCardAnswerRole(input, action);
  if (scopeId === "coverage_search" && sourceRole === "search") {
    return {
      key: "runner_goal_fit_coverage_search",
      label: "Coverage-Suche",
      value: 1400,
      reason: "source_role:search",
    };
  }
  if (scopeId === "setup_card_search" && sourceRole === "search") {
    return {
      key: "runner_goal_fit_setup_search",
      label: "Setup-Suche",
      value: 1000,
      reason: "source_role:search",
    };
  }
  if (
    scopeId === "basic_economy_draw" &&
    sourceRole === "draw" &&
    action.type !== "draw_card"
  ) {
    return {
      key: "runner_goal_fit_card_draw",
      label: "Kartenzieh-Antwort",
      value: 900,
      reason: "source_role:draw",
    };
  }
  if (action.type !== "start_run") return undefined;
  if (action.payload?.runOnlyAction === true) {
    const capAssessment = dependencies.runActionSpendingCapAssessment(
      input,
      action,
    );
    return {
      key: "runner_goal_fit_run_only_action",
      label: "Run-only-Aktion",
      value: capAssessment.ok ? 900 : -900,
      reason: [
        `cap_ok:${capAssessment.ok}`,
        `cap_reason:${capAssessment.reason}`,
        `visible_break_cost:${capAssessment.visibleBreakCost}`,
      ].join("|"),
    };
  }
  const evaluation = dependencies.runTargetEvaluationForAction(input, action);
  const tacticalGoalFit = runnerTacticalGoalRunFitScoreComponent(
    evaluation,
    runnerTacticalGoalsForInput(input),
  );
  if (tacticalGoalFit) return tacticalGoalFit;
  if (
    evaluation &&
    evaluation.pathPassability === "reachable" &&
    evaluation.recommendation !== "do_not_run_now"
  ) {
    return {
      key: "runner_goal_fit_reachable_run",
      label: "Erreichbarer Run",
      value: 650,
      reason: [
        `target:${evaluation.targetServerId}`,
        `recommendation:${evaluation.recommendation}`,
        `payoff:${evaluation.accessPayoff}`,
      ].join("|"),
    };
  }
  return undefined;
}

function runnerTacticalGoalsForInput(
  input: AiDecisionInput,
): readonly RunnerTacticalGoal[] {
  return (
    input as AiDecisionInput & {
      ownRunnerTacticalGoals?: readonly RunnerTacticalGoal[];
    }
  ).ownRunnerTacticalGoals ?? [];
}

function runnerTacticalGoalRunFitScoreComponent(
  evaluation: RunnerRunTargetEvaluation | undefined,
  goals: readonly RunnerTacticalGoal[],
): AiDecisionScoreComponent | undefined {
  if (!evaluation || goals.length === 0) return undefined;
  const matchingGoal = goals
    .filter(
      (goal) =>
        goal.targetServerId === evaluation.targetServerId &&
        (goal.goalId === "runner.pressure_good_central_target" ||
          goal.goalId === "runner.contest_remote_if_score_threat"),
    )
    .sort((left, right) => right.priority - left.priority)[0];
  if (!matchingGoal) return undefined;
  return {
    key: "runner_goal_fit_tactical_goal_run_target",
    label: "Runner-TacticalGoal-Ziel",
    value: 700 + Math.min(300, Math.max(0, matchingGoal.priority - 700)),
    reason: [
      `goal:${matchingGoal.goalId}`,
      `target:${evaluation.targetServerId}`,
      `recommendation:${evaluation.recommendation}`,
      `urgency:${matchingGoal.urgency}`,
    ].join("|"),
  };
}
