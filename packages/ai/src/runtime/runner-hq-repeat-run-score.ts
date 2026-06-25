import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import { reconstructBeliefState } from "../belief-state";
import { isLowValueKnownAccessCard } from "./runner-low-value-known-access-card";

export function staleKnownHqRepeatRunPenalty(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  if (
    input.side !== "runner" ||
    action.type !== "start_run" ||
    action.payload?.serverId !== "hq"
  )
    return 0;
  if (
    input.legalActions.some(
      (candidate) =>
        candidate.type === "trash_accessed_card" ||
        candidate.type === "steal_agenda",
    )
  )
    return 0;
  const hqHandMemory =
    reconstructBeliefState(input).runnerOpponentModel?.hqHandMemory;
  if (
    !hqHandMemory?.allCardsKnown ||
    hqHandMemory.knownDefinitions.length === 0
  )
    return 0;
  return hqHandMemory.knownDefinitions.every((definitionId) =>
    isLowValueKnownAccessCard(definitionId, input.playerView.own.credits),
  )
    ? 430
    : 0;
}
