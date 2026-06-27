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
  const tacticalGoalNonRunFit = runnerTacticalGoalNonRunFitScoreComponent(
    input,
    action,
    scopeId,
    sourceRole,
    actionSemanticCandidate,
    runnerTacticalGoalsForInput(input),
  );
  if (tacticalGoalNonRunFit) return tacticalGoalNonRunFit;
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
  const tacticalGoalRiskControl =
    runnerTacticalGoalRiskControlRunScoreComponent(
      evaluation,
      runnerTacticalGoalsForInput(input),
    );
  if (tacticalGoalRiskControl) return tacticalGoalRiskControl;
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

function runnerTacticalGoalNonRunFitScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  sourceRole: RunnerSourceCardAnswerRole | undefined,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  goals: readonly RunnerTacticalGoal[],
): AiDecisionScoreComponent | undefined {
  if (goals.length === 0) return undefined;
  const setupGoal = highestPriorityGoal(goals, [
    "runner.find_or_install_primary_breaker",
    "runner.draw_or_search_for_setup",
  ]);
  const economyGoal = highestPriorityGoal(goals, [
    "runner.build_economy_base",
    "runner.maintain_credit_and_hand_buffer",
  ]);
  if (
    economyGoal &&
    !runnerHasAcuteTagCleanupNeed(input) &&
    !runnerSetupGoalShouldDeferEconomy(setupGoal, economyGoal) &&
    runnerActionBuildsEconomy(action, actionSemanticCandidate)
  ) {
    return {
      key: "runner_goal_fit_tactical_goal_economy",
      label: "Runner-TacticalGoal-Economy",
      value: scoreValueForTacticalGoal(economyGoal),
      reason: runnerTacticalGoalReason(economyGoal, [
        `action:${action.type}`,
        `scope:${scopeId}`,
      ]),
    };
  }
  if (setupGoal && runnerActionBuildsSetup(action, scopeId, sourceRole)) {
    return {
      key: "runner_goal_fit_tactical_goal_setup",
      label: "Runner-TacticalGoal-Setup",
      value: scoreValueForTacticalGoal(setupGoal),
      reason: runnerTacticalGoalReason(setupGoal, [
        `action:${action.type}`,
        `scope:${scopeId}`,
        `source_role:${sourceRole ?? "none"}`,
      ]),
    };
  }
  return undefined;
}

function runnerTacticalGoalRiskControlRunScoreComponent(
  evaluation: RunnerRunTargetEvaluation | undefined,
  goals: readonly RunnerTacticalGoal[],
): AiDecisionScoreComponent | undefined {
  if (!evaluation || goals.length === 0) return undefined;
  const riskGoal = highestPriorityGoal(goals, [
    "runner.avoid_low_value_risk_runs",
  ]);
  if (!riskGoal || !runnerRunTargetIsLowValueRisk(evaluation)) {
    return undefined;
  }
  return {
    key: "runner_goal_fit_tactical_goal_risk_control",
    label: "Runner-TacticalGoal-Risikokontrolle",
    value: -scoreValueForTacticalGoal(riskGoal),
    reason: runnerTacticalGoalReason(riskGoal, [
      `target:${evaluation.targetServerId}`,
      `recommendation:${evaluation.recommendation}`,
      `payoff:${evaluation.accessPayoff}`,
    ]),
  };
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
    value: scoreValueForTacticalGoal(matchingGoal),
    reason: runnerTacticalGoalReason(matchingGoal, [
      `target:${evaluation.targetServerId}`,
      `recommendation:${evaluation.recommendation}`,
    ]),
  };
}

function highestPriorityGoal(
  goals: readonly RunnerTacticalGoal[],
  goalIds: readonly RunnerTacticalGoal["goalId"][],
): RunnerTacticalGoal | undefined {
  return goals
    .filter((goal) => goalIds.includes(goal.goalId))
    .sort((left, right) => right.priority - left.priority)[0];
}

function runnerActionBuildsEconomy(
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): boolean {
  return (
    action.type === "gain_credit" ||
    actionSemanticCandidate?.semanticActionType === "economy.gain_credit" ||
    actionSemanticCandidateHasSignal(actionSemanticCandidate, "economy.")
  );
}

function runnerHasAcuteTagCleanupNeed(input: AiDecisionInput): boolean {
  return input.playerView.own.tags > 0;
}

function runnerSetupGoalShouldDeferEconomy(
  setupGoal: RunnerTacticalGoal | undefined,
  economyGoal: RunnerTacticalGoal,
): boolean {
  return Boolean(
    setupGoal &&
      setupGoal.priority >= 880 &&
      economyGoal.priority - setupGoal.priority < 120,
  );
}

function runnerActionBuildsSetup(
  action: LegalAction,
  scopeId: string,
  sourceRole: RunnerSourceCardAnswerRole | undefined,
): boolean {
  return (
    action.type === "draw_card" ||
    sourceRole === "search" ||
    sourceRole === "draw" ||
    scopeId === "coverage_search" ||
    scopeId === "setup_card_search"
  );
}

function runnerRunTargetIsLowValueRisk(
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  return (
    evaluation.recommendation === "do_not_run_now" ||
    evaluation.recommendation === "draw_for_damage_buffer" ||
    evaluation.knownAccessState === "known_no_current_payoff"
  );
}

function actionSemanticCandidateHasSignal(
  candidate: ActionSemanticCandidate | undefined,
  prefix: string,
): boolean {
  return Boolean(
    candidate?.actionTacticSignals.some((signal) => signal.startsWith(prefix)) ||
      candidate?.cardContextSignals.some((signal) => signal.startsWith(prefix)),
  );
}

function scoreValueForTacticalGoal(goal: RunnerTacticalGoal): number {
  return 700 + Math.min(300, Math.max(0, goal.priority - 700));
}

function runnerTacticalGoalReason(
  goal: RunnerTacticalGoal,
  details: readonly string[],
): string {
  return [
    `goal:${goal.goalId}`,
    `urgency:${goal.urgency}`,
    ...details,
  ].join("|");
}
