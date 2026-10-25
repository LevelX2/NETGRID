import { CARD_DEFINITIONS_BY_ID } from "../card-definitions";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import { overadvanceAgendaPointBonus } from "./overadvance-agenda-points";

export type AgendaDefinitionScoreQuote =
  | {
      complete: false;
      reason:
        | "unknown_agenda_definition"
        | "invalid_score_projection"
        | "invalid_score_implementation";
    }
  | {
      complete: true;
      definitionId: string;
      advancementCounters: number;
      effectiveAdvancementRequirement: number;
      agendaPoints: number;
      bonusAgendaPoints: number;
      minimumAdvancementCountersForRequestedPoints: number | null;
    };

/** Quotes point value at scoring from public card identity and visible effective difficulty.
 * This is a rule payoff quote, not legality, affordability or a future-state certificate.
 */
export function quoteAgendaDefinitionScorePoints(
  definitionId: string,
  effectiveAdvancementRequirement: number,
  advancementCounters: number,
  requestedAgendaPoints: number,
): AgendaDefinitionScoreQuote {
  const definition = CARD_DEFINITIONS_BY_ID[definitionId];
  if (!definition || definition.type !== "agenda")
    return { complete: false, reason: "unknown_agenda_definition" };
  if (
    ![
      effectiveAdvancementRequirement,
      advancementCounters,
      requestedAgendaPoints,
    ].every((n) => Number.isSafeInteger(n) && n >= 0)
  )
    return { complete: false, reason: "invalid_score_projection" };
  const basePoints = definition.agendaPoints;
  const implementation =
    cardImplementationForDefinitionId(definitionId)?.scoredAgenda;
  const group =
    implementation?.kind === "overadvance_bonus_agenda_points"
      ? implementation.perExcessAdvancementCounters
      : undefined;
  if (
    typeof basePoints !== "number" ||
    !Number.isSafeInteger(basePoints) ||
    basePoints < 0 ||
    (group !== undefined && (!Number.isSafeInteger(group) || group <= 0))
  )
    return { complete: false, reason: "invalid_score_implementation" };
  const bonusAgendaPoints =
    group === undefined
      ? 0
      : overadvanceAgendaPointBonus(
          advancementCounters,
          effectiveAdvancementRequirement,
          group,
        );
  const agendaPoints = basePoints + bonusAgendaPoints;
  const missingPoints = Math.max(0, requestedAgendaPoints - basePoints);
  const minimumAdvancementCountersForRequestedPoints =
    missingPoints === 0
      ? effectiveAdvancementRequirement
      : group === undefined
        ? null
        : effectiveAdvancementRequirement + missingPoints * group;
  if (
    !Number.isSafeInteger(agendaPoints) ||
    (minimumAdvancementCountersForRequestedPoints !== null &&
      !Number.isSafeInteger(minimumAdvancementCountersForRequestedPoints))
  )
    return { complete: false, reason: "invalid_score_projection" };
  return {
    complete: true,
    definitionId,
    advancementCounters,
    effectiveAdvancementRequirement,
    agendaPoints,
    bonusAgendaPoints,
    minimumAdvancementCountersForRequestedPoints,
  };
}
