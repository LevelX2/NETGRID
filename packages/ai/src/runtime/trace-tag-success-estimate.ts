import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";

export function traceTagExpectedSuccessEstimate(
  input: AiDecisionInput,
): number {
  if (input.side !== "corp") return 0;
  if (input.playerView.own.credits >= input.playerView.opponent.credits + 2)
    return 1;
  if (input.playerView.own.credits >= input.playerView.opponent.credits)
    return 0.5;
  const plausibleSequencePressure =
    input.playerView.own.credits + input.playerView.own.clicks * 2;
  if (plausibleSequencePressure < input.playerView.opponent.credits) return 0;
  return 0.25;
}

export function candidateRequiresSuccessfulTrace(
  candidate: ActionSemanticCandidate | undefined,
): boolean {
  if (!candidate) return false;
  return candidateTraceSignals(candidate).includes("trace.source");
}

function candidateTraceSignals(candidate: ActionSemanticCandidate): string[] {
  return [
    candidate.semanticActionType,
    ...candidate.cardContextSignals,
    ...candidate.actionTacticSignals,
    ...candidate.conditions.map((entry) => entry.kind),
    ...candidate.constraints.map((entry) => entry.kind),
  ]
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.toLocaleLowerCase("en-US"));
}
