import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";

const IMMEDIATE_PUNISH_PAYOFF_SIGNALS = new Set([
  "tag.payoff",
  "damage.payoff",
  "punish.payoff",
  "trash_runner_resource",
  "net_damage",
  "meat_damage",
]);

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

export function traceActionLeavesImmediatePunishWindow(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate | undefined,
): boolean {
  if (!candidateRequiresSuccessfulTrace(candidate)) return true;
  if (!candidate || input.side !== "corp") return false;
  if (candidateHasImmediatePunishPayoff(candidate)) return true;
  const clickCost = Math.max(1, candidate.costProfile.clickCost ?? 1);
  return input.playerView.own.clicks - clickCost > 0;
}

function candidateHasImmediatePunishPayoff(
  candidate: ActionSemanticCandidate,
): boolean {
  return candidateTraceSignals(candidate).some(
    (signal) =>
      IMMEDIATE_PUNISH_PAYOFF_SIGNALS.has(signal) ||
      boundedSignalHasTerm(signal, "flatline"),
  );
}

function boundedSignalHasTerm(signal: string, term: string): boolean {
  return signal
    .split(/[^a-z0-9]+/u)
    .filter(Boolean)
    .includes(term);
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
