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
  return components;
}
