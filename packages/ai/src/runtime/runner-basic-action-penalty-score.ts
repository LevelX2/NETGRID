import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

export function runnerBasicActionPenaltyScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
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
    input.legalActions.some(
      (candidate) =>
        candidate.type === "break_subroutine" ||
        candidate.type === "pump_breaker",
    )
  ) {
    components.push({
      key: "runner_continue_run_ends_run_with_break_available",
      label: "Ungebrochene ETR-Subroutine auslösen",
      value: -2500,
      reason: "break_or_pump_available",
    });
  }
  if (action.type === "end_turn" && input.playerView.own.clicks > 0) {
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
    action.source === "basic_action" &&
    (action.type === "gain_credit" || action.type === "draw_card") &&
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
  return components;
}
