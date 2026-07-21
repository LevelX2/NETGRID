import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import { actionHasImmediateCreditGain } from "../actions/action-effect-classification";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { createAiHintsByCard } from "../ai-hints";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import type { RunnerTacticalGoal } from "../runner-tactical-goals";
import { removesPersistentTraceTagCounter } from "../actions/trace-counter-semantics";
import {
  runnerCoverageSearchSaturation,
  runnerVisibleSearchCoverageNeed,
} from "./runner-search-coverage-need";

const AI_HINTS_BY_CARD = createAiHintsByCard();

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
  rolesForCardId?: (cardId: string | undefined) => readonly string[];
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
    removesPersistentTraceTagCounter(action) &&
    runnerActionUsesLastClick(input, action)
  ) {
    return {
      key: "runner_goal_fit_persistent_trace_counter",
      label: "Persistenten Trace-Zähler entfernen",
      value: 1050,
      reason: [
        `runner_clicks:${input.playerView.own.clicks}`,
        `action_click_cost:${actionClickCost(action)}`,
        "counter_type:trace_tag_counter",
      ].join("|"),
    };
  }
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
    const coverageNeed = runnerVisibleSearchCoverageNeed(input);
    if (!coverageNeed) {
      const optionalDevelopment = highestPriorityGoal(
        runnerTacticalGoalsForInput(input),
        ["runner.develop_specialized_breaker"],
      );
      const searchableOptional = optionalDevelopment?.evidence.find((entry) =>
        entry.startsWith("breaker_optional_searchable:"),
      );
      if (
        optionalDevelopment &&
        searchableOptional &&
        !searchableOptional.endsWith(":none")
      ) {
        return {
          key: "runner_goal_fit_optional_breaker_development",
          label: "Optionale Breaker-Weiterentwicklung",
          value: 420,
          reason: runnerTacticalGoalReason(optionalDevelopment, [
            searchableOptional,
            "minimum_coverage_already_complete:true",
          ]),
        };
      }
      return {
        key: "runner_goal_fit_coverage_search_no_need",
        label: "Coverage-Suche ohne Bedarf",
        value: -1400,
        reason: "no_visible_unresolved_coverage_need",
      };
    }
    const saturation = runnerCoverageSearchSaturation(
      input,
      dependencies.rolesForCardId,
    );
    if (saturation) {
      return {
        key: "runner_goal_fit_coverage_search_saturated",
        label: "Coverage-Suche gesaettigt",
        value: -1200,
        reason: [
          `required:${saturation.requiredCoverage}`,
          `server:${saturation.serverId}`,
          `hand_answer:${saturation.handAnswerDefinitionId ?? "visible"}`,
        ].join("|"),
      };
    }
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
    const drawAmount = hintedDrawAmountForAction(input, action);
    return {
      key: "runner_goal_fit_card_draw",
      label: "Kartenzieh-Antwort",
      value: 900 + Math.min(4, Math.max(0, (drawAmount ?? 1) - 1)) * 100,
      reason: [
        "source_role:draw",
        ...(drawAmount !== undefined ? [`hint_draw_amount:${drawAmount}`] : []),
      ].join("|"),
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
  const evaluation = dependencies.runTargetEvaluationForAction(input, action);
  if (action.type !== "start_run") {
    if (!evaluation) return undefined;
    if (
      evaluation.recommendation !== "run_now" &&
      !runnerRunTargetHasHighValueAccess(evaluation)
    ) {
      return undefined;
    }
  }
  if (action.type === "start_run" && action.payload?.runOnlyAction === true) {
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
  const tacticalGoalBypassFit = runnerTacticalGoalBypassRunFitScoreComponent(
    action,
    actionSemanticCandidate,
    evaluation,
    runnerTacticalGoalsForInput(input),
  );
  if (tacticalGoalBypassFit) return tacticalGoalBypassFit;
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
    (evaluation.recommendation === "run_now" ||
      runnerRunTargetHasHighValueAccess(evaluation))
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

function runnerActionUsesLastClick(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const clickCost = actionClickCost(action);
  return clickCost > 0 && input.playerView.own.clicks <= clickCost;
}

function actionClickCost(action: LegalAction): number {
  return action.costs.reduce(
    (sum, cost) => sum + Math.max(0, cost.clicks ?? 0),
    0,
  );
}

function hintedDrawAmountForAction(
  input: AiDecisionInput,
  action: LegalAction,
): number | undefined {
  const directDefinitionIds = [
    action.payload?.sourceDefinitionId,
    action.payload?.sourceCardDefinitionId,
    action.payload?.cardDefinitionId,
    action.payload?.definitionId,
    action.source,
  ].filter((value): value is string => typeof value === "string");
  let definitionId = directDefinitionIds.find((id) => AI_HINTS_BY_CARD.has(id));
  if (!definitionId) {
    const instanceIds = [
      action.payload?.sourceCardInstanceId,
      action.payload?.sourceInstanceId,
      action.payload?.cardInstanceId,
      action.payload?.cardId,
      action.source,
    ].filter((value): value is string => typeof value === "string");
    const own = input.playerView.own;
    const visibleCards = [
      own.identity,
      ...(own.rig ?? []),
      ...(own.gripOrHq ?? []),
      ...(own.heapOrArchives ?? []),
      ...(own.scoreArea ?? []),
    ].filter(Boolean);
    definitionId = visibleCards.find((card) =>
      instanceIds.includes(card.instanceId),
    )?.definitionId;
  }
  const drawAmounts = (AI_HINTS_BY_CARD.get(definitionId ?? "")?.effects ?? [])
    .filter((effect) => effect.kind === "draw")
    .map((effect) => effect.amount)
    .filter(
      (amount): amount is number =>
        typeof amount === "number" && Number.isFinite(amount) && amount > 0,
    );
  return drawAmounts.length > 0 ? Math.max(...drawAmounts) : undefined;
}

function runnerTacticalGoalsForInput(
  input: AiDecisionInput,
): readonly RunnerTacticalGoal[] {
  return (
    (
      input as AiDecisionInput & {
        ownRunnerTacticalGoals?: readonly RunnerTacticalGoal[];
      }
    ).ownRunnerTacticalGoals ?? []
  );
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
    "runner.develop_specialized_breaker",
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

function runnerTacticalGoalBypassRunFitScoreComponent(
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  evaluation: RunnerRunTargetEvaluation | undefined,
  goals: readonly RunnerTacticalGoal[],
): AiDecisionScoreComponent | undefined {
  if (!evaluation || goals.length === 0) return undefined;
  const bypassGoal = highestPriorityGoal(goals, [
    "runner.use_bypass_for_high_value_access",
  ]);
  if (
    !bypassGoal ||
    !runnerActionHasBypassSignal(action, actionSemanticCandidate) ||
    !runnerRunTargetHasHighValueAccess(evaluation)
  ) {
    return undefined;
  }
  return {
    key: "runner_goal_fit_tactical_goal_bypass_access",
    label: "Runner-TacticalGoal-Bypass-Access",
    value: scoreValueForTacticalGoal(bypassGoal),
    reason: runnerTacticalGoalReason(bypassGoal, [
      `target:${evaluation.targetServerId}`,
      `recommendation:${evaluation.recommendation}`,
      `payoff:${evaluation.accessPayoff}`,
      "bypass:true",
    ]),
  };
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
  const accessBonus =
    evaluation.accessPayoff === "access_bonus" &&
    evaluation.multiaccessAvailable
      ? 420
      : 0;
  return {
    key: "runner_goal_fit_tactical_goal_run_target",
    label: "Runner-TacticalGoal-Ziel",
    value: scoreValueForTacticalGoal(matchingGoal) + accessBonus,
    reason: runnerTacticalGoalReason(matchingGoal, [
      `target:${evaluation.targetServerId}`,
      `recommendation:${evaluation.recommendation}`,
      ...(accessBonus > 0
        ? ["access_bonus:multiaccess", `access_bonus_value:${accessBonus}`]
        : []),
    ]),
  };
}

function highestPriorityGoal(
  goals: readonly RunnerTacticalGoal[],
  goalIds: readonly RunnerTacticalGoal["goalId"][],
): RunnerTacticalGoal | undefined {
  const goalIdSet = new Set(goalIds);
  return goals
    .filter((goal) => goalIdSet.has(goal.goalId))
    .sort((left, right) => right.priority - left.priority)[0];
}

function runnerActionBuildsEconomy(
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): boolean {
  return (
    actionHasImmediateCreditGain(action) ||
    (actionSemanticCandidate?.economyProjection?.netLiquidCreditGain ?? 0) >
      0 ||
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

function runnerActionHasBypassSignal(
  action: LegalAction,
  candidate: ActionSemanticCandidate | undefined,
): boolean {
  if (
    action.payload?.bypassFirstIce === true ||
    action.payload?.bypass === true
  ) {
    return true;
  }
  return actionSemanticCandidateHasSignal(candidate, "bypass");
}

function runnerRunTargetHasHighValueAccess(
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  return (
    evaluation.accessPayoff === "agenda" ||
    evaluation.accessPayoff === "trash_affordable" ||
    evaluation.accessPayoff === "score_threat" ||
    evaluation.accessPayoff === "fresh" ||
    evaluation.accessPayoff === "access_bonus"
  );
}

function actionSemanticCandidateHasSignal(
  candidate: ActionSemanticCandidate | undefined,
  prefix: string,
): boolean {
  return Boolean(
    candidate?.actionTacticSignals.some((signal) =>
      signal.startsWith(prefix),
    ) ||
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
  return [`goal:${goal.goalId}`, `urgency:${goal.urgency}`, ...details].join(
    "|",
  );
}
