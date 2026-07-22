import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import {
  actionHasImmediateCreditGain,
  isBasicCreditAction,
} from "../actions/action-effect-classification";
import { runnerHasMeaningfulCreditConversionAlternative } from "./runner-marginal-credit-value";
import { encounterContinueAcceptsOnlyNonlethalDamageThreats } from "./encounter-subroutine";

export type RunnerBasicActionPenaltyScoreDependencies = {
  encounterActionIsViable: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
};

const DEFAULT_DEPENDENCIES: RunnerBasicActionPenaltyScoreDependencies = {
  encounterActionIsViable: () => true,
};

export function runnerBasicActionPenaltyScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  dependencies: RunnerBasicActionPenaltyScoreDependencies = DEFAULT_DEPENDENCIES,
): AiDecisionScoreComponent[] {
  const components: AiDecisionScoreComponent[] = [];
  if (action.type === "jack_out" && scopeId === "simple_run_choice") {
    components.push({
      key: "runner_jack_out_pressure_loss",
      label: "Run abbrechen",
      value: -450,
      reason: scopeId,
    });
  }
  if (
    action.type === "continue_run" &&
    scopeId === "simple_run_choice" &&
    action.payload?.encounterWillEndRun === true &&
    action.payload?.encounterSourceWillTrashAtEndOfTurn !== true &&
    !encounterContinueAcceptsOnlyNonlethalDamageThreats(input) &&
    input.legalActions.some(
      (candidate) =>
        (candidate.type === "break_subroutine" ||
          candidate.type === "pump_breaker") &&
        dependencies.encounterActionIsViable(input, candidate),
    )
  ) {
    components.push({
      key: "runner_continue_run_ends_run_with_break_available",
      label: "Ungebrochene ETR-Subroutine auslösen",
      value: -2500,
      reason: "break_or_pump_available",
    });
  }
  if (
    action.type === "end_turn" &&
    input.playerView.own.clicks > 0 &&
    !runnerCanYieldUnusedActionsAfterRichConversionWindow(input, action)
  ) {
    components.push({
      key: "runner_unused_actions",
      label: "Ungenutzte Aktionen",
      value: -1500,
      reason: `actions:${input.playerView.own.clicks}`,
    });
  }
  const pressureGoal = (
    input as AiDecisionInput & {
      ownRunnerTacticalGoals?: readonly {
        goalId: string;
        priority: number;
        targetServerId?: string;
      }[];
    }
  ).ownRunnerTacticalGoals
    ?.filter(
      (goal) =>
        goal.goalId === "runner.pressure_good_central_target" &&
        goal.priority >= 800,
    )
    .sort((left, right) => right.priority - left.priority)[0];
  const matchingPressureRun = pressureGoal
    ? input.legalActions.find(
        (candidate) =>
          candidate.type === "start_run" &&
          candidate.payload?.serverId === pressureGoal.targetServerId &&
          candidate.payload?.knownNoCurrentPayoff !== true,
      )
    : undefined;
  if (
    matchingPressureRun &&
    (isBasicCreditAction(action) ||
      (action.source === "basic_action" && action.type === "draw_card")) &&
    input.playerView.own.credits >= 4
  ) {
    components.push({
      key: "runner_basic_setup_over_ready_pressure",
      label: "Basis-Setup vor bereitem Zentraldruck",
      value: action.type === "gain_credit" ? -1200 : -900,
      reason: [
        `goal:${pressureGoal?.goalId}`,
        `priority:${pressureGoal?.priority}`,
        `target:${pressureGoal?.targetServerId}`,
        `run_action:${matchingPressureRun.actionId}`,
      ].join("|"),
    });
  }
  if (
    actionHasImmediateCreditGain(action) &&
    input.playerView.own.credits >= 10 &&
    runnerHasMeaningfulCreditConversionAlternative(input, action)
  ) {
    const immediateDrawAmount = actionImmediateDrawAmount(action);
    components.push({
      key: "runner_rich_credit_without_conversion",
      label: "Weitere Credits statt Konversion",
      value: immediateDrawAmount > 0 ? -150 : -1200,
      reason: [
        `credits:${input.playerView.own.credits}`,
        "conversion_alternative:true",
        `immediate_draw:${immediateDrawAmount}`,
      ].join("|"),
    });
  }
  return components;
}

function actionImmediateDrawAmount(action: LegalAction): number {
  for (const key of ["drawCardsAmount", "drawAmount", "drawCount"] as const) {
    const amount = action.payload?.[key];
    if (typeof amount === "number" && Number.isFinite(amount) && amount > 0) {
      return Math.floor(amount);
    }
  }
  return 0;
}

function runnerCanYieldUnusedActionsAfterRichConversionWindow(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  return (
    input.playerView.own.credits >= 10 &&
    runnerHasMeaningfulCreditConversionAlternative(input, action)
  );
}
