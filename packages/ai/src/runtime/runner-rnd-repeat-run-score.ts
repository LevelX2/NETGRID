import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
} from "@netgrid/shared";
import {
  reconstructBeliefState,
  type RndTopFreshnessMemory,
} from "../belief-state";
import { RUNTIME_CARDS } from "../ai-hints";

export function staleKnownRndRepeatRunPenalty(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  if (
    input.side !== "runner" ||
    action.type !== "start_run" ||
    action.payload?.serverId !== "rd"
  )
    return 0;
  const freshness =
    reconstructBeliefState(input).runnerOpponentModel?.rndTopFreshness;
  // Public-event belief marks this only after Runner already accessed R&D and no visible draw, shuffle, reorder, swap, steal, or trash changed the top card.
  if (freshness?.freshness !== "stale_known_same_top") return 0;
  if (rndKnownTopIsAgendaForAi(freshness)) return 0;
  return rndKnownTopIsLowValueForAi(freshness) ||
    !freshness.knownTopDefinitionId
    ? 420
    : 0;
}

export function rndFreshRepeatRunBoost(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  if (
    input.side !== "runner" ||
    action.type !== "start_run" ||
    action.payload?.serverId !== "rd"
  )
    return 0;
  const freshness =
    reconstructBeliefState(input).runnerOpponentModel?.rndTopFreshness;
  if (rndKnownTopIsAgendaForAi(freshness)) return 520;
  return freshness?.freshness === "fresh_after_top_removed" ? 170 : 0;
}

function rndKnownTopIsAgendaForAi(
  freshness: RndTopFreshnessMemory | undefined,
): boolean {
  const definitionId = freshness?.knownTopDefinitionId;
  if (!definitionId) return false;
  return (
    freshness.knownTopIsAgenda === true ||
    RUNTIME_CARDS[definitionId]?.type === "agenda" ||
    DEMO_CARDS_BY_ID[definitionId]?.type === "agenda"
  );
}

function rndKnownTopIsLowValueForAi(
  freshness: RndTopFreshnessMemory | undefined,
): boolean {
  const definitionId = freshness?.knownTopDefinitionId;
  if (!definitionId) return false;
  const type =
    RUNTIME_CARDS[definitionId]?.type ?? DEMO_CARDS_BY_ID[definitionId]?.type;
  if (type === "agenda" || type === "asset" || type === "upgrade") return false;
  return freshness.knownTopIsLowValue === true || type !== undefined;
}
