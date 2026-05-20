/**
 * Calculates public ICE strength bonuses from CardImplementation modifiers.
 *
 * The query is read-only and current-state based. It supports scored agenda and
 * rezzed Corp root sources but does not contain card-specific strength rules.
 */
import type { CardDefinition, CardInstanceId, GameState } from "@netgrid/shared";
import {
  activeCardImplementationModifiersForCorpRoot,
  activeCardImplementationModifiersForScoredCorpAgendas,
  cardDefinitionForInstance,
  cardInstanceFor,
  cardMatchesModifierAppliesTo,
  isPublicRezzedCorpRootModifier,
  isPublicScoredCorpAgendaModifier,
  sameServerAsSourceApplies,
} from "./card-implementation-modifiers";
import type { CardIceStrengthModifierImplementation } from "./definition-types";

function iceStrengthModifierAppliesToIce(
  state: GameState,
  modifier: CardIceStrengthModifierImplementation,
  sourceCardInstanceId: CardInstanceId,
  iceId: CardInstanceId,
  iceDefinition: CardDefinition,
): boolean {
  if (modifier.operation !== "increase") return false;
  if (
    !isPublicRezzedCorpRootModifier(modifier) &&
    !isPublicScoredCorpAgendaModifier(modifier)
  )
    return false;
  if (modifier.appliesTo.side !== "corp") return false;
  if (!cardMatchesModifierAppliesTo(iceDefinition, modifier.appliesTo))
    return false;
  return sameServerAsSourceApplies(
    state,
    sourceCardInstanceId,
    iceId,
    modifier.appliesTo.sameServerAsSource,
  );
}

/**
 * Returns the active CardImplementation strength bonus for one rezzed ICE.
 *
 * PlayerView, encounter, and revalidation callers must add this to the same
 * base strength they already use, rather than duplicating modifier traversal.
 */
export function iceStrengthModifierBonusFor(
  state: GameState,
  iceId: CardInstanceId,
): number {
  const iceInstance = cardInstanceFor(state, iceId);
  if (!iceInstance.rezzed) return 0;
  const iceDefinition = cardDefinitionForInstance(state, iceId);
  if (iceDefinition.type !== "ice") return 0;
  let bonus = 0;
  for (const match of activeCardImplementationModifiersForCorpRoot(
    state,
    "ice_strength",
  )) {
    if (
      !iceStrengthModifierAppliesToIce(
        state,
        match.modifier,
        match.sourceCardInstanceId,
        iceId,
        iceDefinition,
      )
    )
      continue;
    bonus += match.modifier.amount;
  }
  for (const match of activeCardImplementationModifiersForScoredCorpAgendas(
    state,
    "ice_strength",
  )) {
    if (
      !iceStrengthModifierAppliesToIce(
        state,
        match.modifier,
        match.sourceCardInstanceId,
        iceId,
        iceDefinition,
      )
    )
      continue;
    bonus += match.modifier.amount;
  }
  return bonus;
}
