import type { AiDecisionInput } from "@netgrid/shared";

export type RunnerLoanGamePhase = "opening" | "midgame" | "late";

export function runnerLoanGamePhase(
  input: AiDecisionInput,
): RunnerLoanGamePhase {
  if (
    input.playerView.own.agendaPoints >=
      input.playerView.agendaPointsToWin - 2 ||
    input.playerView.opponent.agendaPoints >=
      input.playerView.agendaPointsToWin - 2 ||
    input.actionNumber >= 40
  ) {
    return "late";
  }
  if (
    input.actionNumber <= 10 &&
    input.playerView.own.agendaPoints === 0 &&
    input.playerView.opponent.agendaPoints === 0
  ) {
    return "opening";
  }
  return "midgame";
}

export function runnerLoanResourceTrashRisk(input: AiDecisionInput): boolean {
  return (
    input.playerView.own.tags > 0 ||
    input.legalActions.some((action) => action.type === "remove_tag")
  );
}
