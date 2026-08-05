import {
  CARD_DEFINITIONS_BY_ID,
  type CardDefinitionId,
  type CardInstanceId,
} from "@netgrid/shared";
import { icebreakerAbilitiesForDefinition } from "../../ability-engine/icebreaker-abilities";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";

/**
 * Public, side-safe description of one breaker against one already visible
 * ICE.  It deliberately derives only from card implementations and visible
 * instance state; callers must not reconstruct these values from rules text.
 */
export type VisibleBreakerEncounterQuote = {
  breakerInstanceId: string;
  iceInstanceId?: string;
  effectiveStrength: number;
  pumpCost?: number;
  pumpStrengthGain?: number;
  breakCost: number;
  maximumSubroutinesPerUse: number;
  coverageStatus: "full" | "none" | "requires_selection";
  postBreakStealthLossPerUse?: number;
  endsRunAfterUse?: true;
};

export function visibleBreakerEncounterQuote(params: {
  breakerDefinitionId: CardDefinitionId;
  breakerInstanceId: string;
  breakerStrength: number;
  selectedTargetCardId?: CardInstanceId;
  selectedSubtype?: string;
  iceDefinitionId: CardDefinitionId;
  iceInstanceId?: string;
  iceSubtypes?: readonly string[];
}): VisibleBreakerEncounterQuote | undefined {
  const breaker = CARD_DEFINITIONS_BY_ID[params.breakerDefinitionId];
  const ice = CARD_DEFINITIONS_BY_ID[params.iceDefinitionId];
  if (!breaker || !ice || breaker.type !== "program" || ice.type !== "ice") {
    return undefined;
  }
  const abilities = icebreakerAbilitiesForDefinition(breaker);
  const breakAbility = abilities.find(
    (ability) =>
      ability.type === "break_subroutine" &&
      breakAbilityMatchesIce(ability, params.selectedSubtype, params.iceSubtypes ?? ice.subtypes),
  );
  if (!breakAbility) {
    const hasDeferredSelection = abilities.some(
      (ability) => ability.type === "break_subroutine" && ability.selectedIceSubtypeFromBreaker,
    );
    return hasDeferredSelection
      ? {
          breakerInstanceId: params.breakerInstanceId,
          ...(params.iceInstanceId ? { iceInstanceId: params.iceInstanceId } : {}),
          effectiveStrength: effectiveStrength(params),
          breakCost: 0,
          maximumSubroutinesPerUse: 0,
          coverageStatus: "requires_selection",
        }
      : undefined;
  }
  const pump = abilities.find((ability) => ability.type === "pump_strength");
  const stealthLoss = breakAbility.postBreakStealthLoss;
  return {
    breakerInstanceId: params.breakerInstanceId,
    ...(params.iceInstanceId ? { iceInstanceId: params.iceInstanceId } : {}),
    effectiveStrength: effectiveStrength(params),
    ...(pump
      ? {
          pumpCost: pump.cost.credits,
          pumpStrengthGain: pump.amount,
        }
      : {}),
    breakCost: breakAbility.cost.credits ?? 0,
    maximumSubroutinesPerUse: Math.max(1, breakAbility.count ?? 1),
    coverageStatus: "full",
    ...(stealthLoss !== undefined
      ? { postBreakStealthLossPerUse: stealthLoss }
      : {}),
    ...(breakAbility.onUseEndRun ? { endsRunAfterUse: true } : {}),
  };
}

function effectiveStrength(params: {
  breakerDefinitionId: CardDefinitionId;
  breakerStrength: number;
  selectedTargetCardId?: CardInstanceId;
  iceInstanceId?: string;
}): number {
  const bonus = cardImplementationForDefinitionId(params.breakerDefinitionId)
    ?.icebreakerEncounterStrengthBonus;
  const applies =
    bonus?.kind === "against_selected_installed_ice" &&
    params.selectedTargetCardId === params.iceInstanceId;
  return Math.max(0, Math.floor(params.breakerStrength) + (applies ? bonus.amount : 0));
}

function breakAbilityMatchesIce(
  ability: ReturnType<typeof icebreakerAbilitiesForDefinition>[number],
  selectedSubtype: string | undefined,
  iceSubtypes: readonly string[],
): boolean {
  if (ability.type !== "break_subroutine") return false;
  if (ability.selectedIceSubtypeFromBreaker) {
    return (
      selectedSubtype !== undefined &&
      hasSubtype(iceSubtypes, selectedSubtype)
    );
  }
  if (ability.iceSubtype) return hasSubtype(iceSubtypes, ability.iceSubtype);
  if (ability.iceSubtypes) return ability.iceSubtypes.some((subtype) => hasSubtype(iceSubtypes, subtype));
  // Tag-limited breakers are handled by the existing subroutine-level path.
  return !ability.subroutineBreakTags;
}

function hasSubtype(subtypes: readonly string[], expected: string): boolean {
  const key = (value: string) => value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return subtypes.some((subtype) => key(subtype) === key(expected));
}
