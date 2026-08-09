/**
 * Adapts declarative CardImplementation icebreaker abilities into the existing
 * encounter action shape. The adapter is read-only; break, pump, payment and
 * stale-action revalidation stay in the run engine.
 */
import type {
  AbilityDefinition,
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  LegalAction,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import {
  assertAbilityRefIdentity,
  capabilityKey,
  canonicalCapabilityId,
  parseCanonicalCapabilityId,
  type CapabilityKey,
} from "@netgrid/cards/engine";
import type {
  CardIcebreakerAbilityImplementation,
  CardIcebreakerBreakMatcherImplementation,
  CardIcebreakerBreakSpecialImplementation,
} from "./definition-types";

export type RuntimeIcebreakerSpecialEffect =
  | {
      kind: "random_break_or_damage";
      successDieResults: readonly number[];
      failureDamageType: "net";
      maxFailureDamage: 3;
      oncePerSubroutinePerEncounter: true;
    }
  | {
      kind: "post_encounter_self_trash_check";
      trashDieResults: readonly [1];
      dieSides: 6;
    }
  | { kind: "run_start_random_strength_bonus" }
  | { kind: "strength_bonus_per_successful_break_this_run" }
  | { kind: "run_end_add_counter_if_used_on_last_fort" }
  | { kind: "once_per_run_break_tag_and_all_stealth_loss" }
  | { kind: "run_end_trash_source_if_used" }
  | { kind: "set_next_sentry_free_break_after_fully_breaking_wall" };

export type RuntimeIcebreakerAbility = AbilityDefinition & {
  iceSubtypes?: readonly string[];
  iceDefinitionIds?: readonly CardDefinitionId[];
  selectedIceSubtypeFromBreaker?: true;
  strengthDuration?: "current_encounter" | "current_run" | "current_turn";
  variableStrength?: { min: number };
  pumpConsequences?: readonly {
    kind: "lose_future_clicks";
    amountPerStrength: number;
  }[];
  postBreakStealthLossSourceMode?: "single_stealth_card" | "any_stealth_cards";
  postBreakStealthLossOptionalIfUnavailable?: boolean;
  postBreakStealthLossTrigger?: "per_subroutine" | "per_ability_use";
  onUseEndRun?: boolean;
  breakAllMatchingSubroutines?: boolean;
  special?:
    | "run_start_random_strength_bonus"
    | "blink_random_break_or_net_damage"
    | "bartmoss_post_encounter_self_trash_check"
    | "snowball_run_strength_per_successful_break"
    | "dupre_strength_counter_and_last_fort"
    | "once_per_run_break_tag_and_all_stealth_loss"
    | "run_end_trash_source_if_used"
    | "set_next_sentry_free_break_after_fully_breaking_wall";
  specialEffects?: readonly RuntimeIcebreakerSpecialEffect[];
  source:
    | "shared_card_definition"
    | "card_implementation"
    | "card_spec_capability";
};

export class IcebreakerAbilityBindingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IcebreakerAbilityBindingError";
  }
}

export function icebreakerAbilityBindingPayload(
  ability: RuntimeIcebreakerAbility,
  breakerId: CardInstanceId,
): Record<string, string> {
  if (ability.source !== "card_spec_capability") return {};
  const parsed = parseCanonicalCapabilityId(ability.id);
  return {
    cardId: breakerId,
    cardImplementationCapabilityBindingKind: "card_spec_capability_key",
    cardImplementationAbilityKey: parsed.capabilityKey,
    cardImplementationAbilityId: ability.id,
  };
}

export function icebreakerAbilityForLegalAction(
  definition: Pick<CardDefinition, "id" | "abilities">,
  breakerId: CardInstanceId,
  legalAction: LegalAction,
  expectedType: RuntimeIcebreakerAbility["type"],
): RuntimeIcebreakerAbility {
  return resolveIcebreakerAbilityBinding(
    icebreakerAbilitiesForDefinition(definition),
    definition.id,
    breakerId,
    legalAction,
    expectedType,
  );
}

export function resolveIcebreakerAbilityBinding(
  abilities: readonly RuntimeIcebreakerAbility[],
  definitionId: CardDefinitionId,
  breakerId: CardInstanceId,
  legalAction: LegalAction,
  expectedType: RuntimeIcebreakerAbility["type"],
): RuntimeIcebreakerAbility {
  const abilityRef = legalAction.abilityRef;
  try {
    assertAbilityRefIdentity(abilityRef);
  } catch {
    throw new IcebreakerAbilityBindingError(
      "Die Breaker-Faehigkeitsreferenz ist nicht eindeutig gebunden.",
    );
  }
  if (abilityRef.sourceCardInstanceId !== breakerId)
    throw new IcebreakerAbilityBindingError(
      "Die Breaker-Faehigkeit ist nicht an ihre Quellinstanz gebunden.",
    );
  if ("sourceAbilityId" in abilityRef) {
    if (typeof abilityRef.sourceAbilityId !== "string")
      throw new IcebreakerAbilityBindingError(
        "Die kanonische Breaker-Faehigkeits-ID fehlt.",
      );
    const parsed = parseCanonicalCapabilityId(abilityRef.sourceAbilityId);
    const payload = legalAction.payload;
    if (
      parsed.cardDefinitionId !== definitionId ||
      payload?.cardId !== breakerId ||
      payload?.cardImplementationCapabilityBindingKind !==
        "card_spec_capability_key" ||
      payload.cardImplementationAbilityId !== abilityRef.sourceAbilityId ||
      payload.cardImplementationAbilityKey !== parsed.capabilityKey ||
      payload.cardImplementationAbilityIndex !== undefined ||
      payload.cardImplementationLifecycleAbilityIndex !== undefined
    )
      throw new IcebreakerAbilityBindingError(
        "Die kanonische Breaker-Faehigkeitsbindung ist unvollstaendig oder widerspruechlich.",
      );
    const matches = abilities.filter(
      (candidate) =>
        candidate.source === "card_spec_capability" &&
        candidate.id === abilityRef.sourceAbilityId &&
        candidate.type === expectedType,
    );
    if (matches.length !== 1)
      throw new IcebreakerAbilityBindingError(
        "Die kanonische Breaker-Faehigkeit existiert nicht eindeutig auf der Quellkarte.",
      );
    return matches[0]!;
  }
  const payload = legalAction.payload;
  if (
    typeof abilityRef.abilityId !== "string" ||
    payload?.cardImplementationCapabilityBindingKind !== undefined ||
    payload?.cardImplementationAbilityId !== undefined ||
    payload?.cardImplementationAbilityKey !== undefined
  )
    throw new IcebreakerAbilityBindingError(
      "Eine Legacy-Breaker-Faehigkeit darf keine kanonische Bindung tragen.",
    );
  const matches = abilities.filter(
    (candidate) =>
      candidate.source !== "card_spec_capability" &&
      candidate.id === abilityRef.abilityId &&
      candidate.type === expectedType,
  );
  if (matches.length !== 1)
    throw new IcebreakerAbilityBindingError(
      "Die Legacy-Breaker-Faehigkeit existiert nicht eindeutig auf der Quellkarte.",
    );
  return matches[0]!;
}

function breakMatcherFields(
  matcher: CardIcebreakerBreakMatcherImplementation,
): Pick<
  RuntimeIcebreakerAbility,
  | "iceSubtype"
  | "iceSubtypes"
  | "iceDefinitionIds"
  | "selectedIceSubtypeFromBreaker"
  | "subroutineBreakTags"
> {
  if (matcher.kind === "any") return {};
  if (matcher.kind === "ice_subtype") return { iceSubtype: matcher.subtype };
  if (matcher.kind === "selected_ice_subtype")
    return { selectedIceSubtypeFromBreaker: true };
  if (matcher.kind === "ice_subtype_any_of")
    return { iceSubtypes: [...matcher.subtypes] };
  if (matcher.kind === "ice_definition_any_of")
    return { iceDefinitionIds: [...matcher.definitionIds] };
  if (matcher.kind === "subroutine_tag")
    return { subroutineBreakTags: [matcher.tag] };
  return { subroutineBreakTags: ["trace"] };
}

function specialEffectsForImplementation(
  special: CardIcebreakerBreakSpecialImplementation | undefined,
): readonly RuntimeIcebreakerSpecialEffect[] | undefined {
  if (!special) return undefined;
  switch (special.kind) {
    case "run_start_random_strength_bonus":
      return [{ kind: "run_start_random_strength_bonus" }];
    case "blink_random_break_or_net_damage":
      return [
        {
          kind: "random_break_or_damage",
          successDieResults: [4, 5, 6],
          failureDamageType: "net",
          maxFailureDamage: 3,
          oncePerSubroutinePerEncounter: true,
        },
      ];
    case "bartmoss_post_encounter_self_trash_check":
      return [
        {
          kind: "post_encounter_self_trash_check",
          trashDieResults: [1],
          dieSides: 6,
        },
      ];
    case "snowball_run_strength_per_successful_break":
      return [{ kind: "strength_bonus_per_successful_break_this_run" }];
    case "dupre_strength_counter_and_last_fort":
      return [{ kind: "run_end_add_counter_if_used_on_last_fort" }];
    case "once_per_run_break_tag_and_all_stealth_loss":
      return [{ kind: "once_per_run_break_tag_and_all_stealth_loss" }];
    case "run_end_trash_source_if_used":
      return [{ kind: "run_end_trash_source_if_used" }];
    case "set_next_sentry_free_break_after_fully_breaking_wall":
      return [{ kind: "set_next_sentry_free_break_after_fully_breaking_wall" }];
    default:
      return undefined;
  }
}

export function icebreakerAbilityHasSpecialEffect(
  ability: RuntimeIcebreakerAbility | undefined,
  kind: RuntimeIcebreakerSpecialEffect["kind"],
): boolean {
  return (
    ability?.specialEffects?.some((effect) => effect.kind === kind) ?? false
  );
}

function abilityForImplementation(
  definition: Pick<CardDefinition, "id">,
  ability: CardIcebreakerAbilityImplementation,
  index: number,
): RuntimeIcebreakerAbility {
  const canonicalKey = capabilityKeyFromImplementation(ability);
  const abilityId = canonicalKey
    ? canonicalCapabilityId(definition.id, canonicalKey)
    : `${definition.id}.card_implementation.icebreaker.${index + 1}.${ability.kind}`;
  const source = canonicalKey
    ? ("card_spec_capability" as const)
    : ("card_implementation" as const);
  if (ability.kind === "increase_strength") {
    return {
      id: abilityId,
      type: "pump_strength",
      cost: { credits: ability.cost.amount },
      amount: ability.amount,
      timingPoint: "run.encounter_ice",
      strengthDuration: ability.duration,
      ...(ability.variableAmount
        ? { variableStrength: { min: ability.variableAmount.min } }
        : {}),
      ...(ability.consequences
        ? { pumpConsequences: ability.consequences }
        : {}),
      ...(ability.onUse?.some((effect) => effect.kind === "end_run")
        ? { onUseEndRun: true }
        : {}),
      source,
    };
  }
  const stealthLoss = ability.onSuccessfulBreak?.find(
    (effect) => effect.kind === "lose_bits_from_stealth_sources",
  );
  const specialEffects = specialEffectsForImplementation(ability.special);
  return {
    id: abilityId,
    type: "break_subroutine",
    cost: { credits: ability.cost.amount },
    count:
      ability.breakTarget === "all_matching_subroutines"
        ? Number.MAX_SAFE_INTEGER
        : (ability.count ?? 1),
    timingPoint: "run.encounter_ice",
    ...(ability.breakTarget === "all_matching_subroutines"
      ? { breakAllMatchingSubroutines: true }
      : {}),
    ...(stealthLoss
      ? {
          postBreakStealthLoss: stealthLoss.amount,
          postBreakStealthLossSourceMode: stealthLoss.sourceMode,
          postBreakStealthLossOptionalIfUnavailable:
            stealthLoss.optionalIfUnavailable,
          postBreakStealthLossTrigger: stealthLoss.trigger,
        }
      : {}),
    ...(ability.onUse?.some((effect) => effect.kind === "end_run")
      ? { onUseEndRun: true }
      : {}),
    ...(ability.special ? { special: ability.special.kind } : {}),
    ...(specialEffects ? { specialEffects } : {}),
    ...breakMatcherFields(ability.matches),
    source,
  };
}

function capabilityKeyFromImplementation(
  ability: CardIcebreakerAbilityImplementation,
): CapabilityKey | undefined {
  if (!("capabilityKey" in ability)) return undefined;
  if (typeof ability.capabilityKey !== "string")
    throw new Error("invalid_card_spec_icebreaker_capability_key");
  return capabilityKey(ability.capabilityKey);
}

export function icebreakerAbilitiesForDefinition(
  definition: Pick<CardDefinition, "id" | "abilities">,
): readonly RuntimeIcebreakerAbility[] {
  const implementation = cardImplementationForDefinitionId(
    definition.id,
  )?.icebreakerAbilities;
  if (implementation?.length)
    return implementation.map((ability, index) =>
      abilityForImplementation(definition, ability, index),
    );
  return (definition.abilities ?? []).map((ability) => ({
    ...ability,
    source: "shared_card_definition" as const,
  }));
}
