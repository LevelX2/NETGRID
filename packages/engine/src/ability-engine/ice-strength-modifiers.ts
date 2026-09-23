/**
 * Calculates public ICE strength bonuses from CardImplementation modifiers.
 *
 * The query is read-only and current-state based. It supports scored agenda and
 * rezzed Corp root sources but does not contain card-specific strength rules.
 */
import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  VisibleCard,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import {
  activeCardImplementationModifiersForCorpRoot,
  activeCardImplementationModifiersForRunnerInstalled,
  activeCardImplementationModifiersForScoredCorpAgendas,
  cardDefinitionForInstance,
  cardInstanceFor,
  cardInstanceMatchesModifierAppliesTo,
  isPublicRezzedCorpRootModifier,
  isPublicRunnerInstalledModifier,
  isPublicScoredCorpAgendaModifier,
  sameServerAsSourceApplies,
} from "./card-implementation-modifiers";
import type { CardIceStrengthModifierImplementation } from "./definition-types";

/**
 * Marginal encounter quote for an additional passive Runner installation.
 * The caller must bind its legal install separately. Mixed effects and scoped
 * sources without a visible target binding are deliberately unsupported.
 */
export function projectVisibleIceAfterPassiveRunnerInstall(
  sourceDefinitionId: string,
  ice: VisibleCard,
): VisibleCard | undefined {
  const implementation = cardImplementationForDefinitionId(sourceDefinitionId);
  const modifiers = implementation?.modifiers;
  if (
    !implementation ||
    !modifiers?.length ||
    Object.keys(implementation).some(
      (key) => key !== "cardDefinitionId" && key !== "modifiers",
    ) ||
    modifiers.some(
      (modifier) =>
        modifier.kind !== "ice_strength" ||
        modifier.operation !== "reduce" ||
        !isPublicRunnerInstalledModifier(modifier) ||
        modifier.appliesTo.sameServerAsSource === true ||
        modifier.appliesTo.side !== "corp" ||
        modifier.appliesTo.cardType !== "ice" ||
        !Number.isSafeInteger(modifier.amount) ||
        modifier.amount <= 0,
    )
  )
    return undefined;
  const quote = ice.effectiveRunQuote;
  if (
    !ice.known ||
    ice.rezzed !== true ||
    ice.type !== "ice" ||
    !quote ||
    quote.iceInstanceId !== ice.instanceId ||
    quote.iceDefinitionId !== ice.definitionId ||
    !Number.isSafeInteger(quote.effectiveStrength) ||
    quote.effectiveStrength < 0 ||
    !Number.isSafeInteger(quote.encounterStrength) ||
    quote.encounterStrength! < 0
  )
    return undefined;
  const reduction = (encounter: boolean) =>
    modifiers.reduce((sum, modifier) => {
      if (modifier.kind !== "ice_strength") return sum;
      if (!encounter && modifier.appliesTo.encounteredOnly) return sum;
      if (
        modifier.appliesTo.subtype &&
        !ice.subtypes?.includes(modifier.appliesTo.subtype)
      )
        return sum;
      return sum + modifier.amount;
    }, 0);
  return {
    ...ice,
    effectiveRunQuote: {
      ...quote,
      effectiveStrength: Math.max(
        0,
        quote.effectiveStrength - reduction(false),
      ),
      encounterStrength: Math.max(
        0,
        quote.encounterStrength! - reduction(true),
      ),
    },
  };
}

function iceStrengthModifierAppliesToIce(
  state: GameState,
  modifier: CardIceStrengthModifierImplementation,
  sourceCardInstanceId: CardInstanceId,
  iceId: CardInstanceId,
  iceDefinition: CardDefinition,
  encounteredIceId: CardInstanceId | undefined,
): boolean {
  if (
    !isPublicRezzedCorpRootModifier(modifier) &&
    !isPublicRunnerInstalledModifier(modifier) &&
    !isPublicScoredCorpAgendaModifier(modifier)
  )
    return false;
  if (modifier.appliesTo.encounteredOnly && encounteredIceId !== iceId)
    return false;
  if (modifier.appliesTo.side !== "corp") return false;
  if (
    !cardInstanceMatchesModifierAppliesTo(
      state,
      iceId,
      iceDefinition,
      modifier.appliesTo,
    )
  )
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
  encounteredIceId = state.run?.encounteredIceId,
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
        encounteredIceId,
      )
    )
      continue;
    bonus +=
      match.modifier.operation === "reduce"
        ? -match.modifier.amount
        : match.modifier.amount;
  }
  for (const match of activeCardImplementationModifiersForRunnerInstalled(
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
        encounteredIceId,
      )
    )
      continue;
    bonus +=
      match.modifier.operation === "reduce"
        ? -match.modifier.amount
        : match.modifier.amount;
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
        encounteredIceId,
      )
    )
      continue;
    bonus +=
      match.modifier.operation === "reduce"
        ? -match.modifier.amount
        : match.modifier.amount;
  }
  return bonus;
}
