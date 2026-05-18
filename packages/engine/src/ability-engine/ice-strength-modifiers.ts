import type { CardDefinition, CardInstanceId, GameState } from "@netgrid/shared";
import {
  activeCardImplementationModifiersForCorpRoot,
  cardDefinitionForInstance,
  cardInstanceFor,
  cardMatchesModifierAppliesTo,
  isPublicRezzedCorpRootModifier,
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
  if (
    modifier.operation !== "increase" ||
    !isPublicRezzedCorpRootModifier(modifier)
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
  return bonus;
}
