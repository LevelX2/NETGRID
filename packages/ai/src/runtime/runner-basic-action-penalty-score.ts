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
