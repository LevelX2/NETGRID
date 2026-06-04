/**
 * Adapts declarative CardImplementation icebreaker abilities into the existing
 * encounter action shape. The adapter is read-only; break, pump, payment and
 * stale-action revalidation stay in the run engine.
 */
import type { AbilityDefinition, CardDefinition } from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import type {
  CardIcebreakerAbilityImplementation,
  CardIcebreakerBreakMatcherImplementation,
} from "./definition-types";

export type RuntimeIcebreakerAbility = AbilityDefinition & {
  iceSubtypes?: readonly string[];
  selectedIceSubtypeFromBreaker?: true;
  strengthDuration?: "current_encounter" | "current_run";
  variableStrength?: { min: number };
  postBreakStealthLossMode?: "total_if_available" | "up_to_if_available";
  onUseEndRun?: boolean;
  breakAllMatchingSubroutines?: boolean;
  special?:
    | "ai_boon_run_start_random_strength"
    | "blink_random_break_or_net_damage"
    | "bartmoss_post_encounter_self_trash_check"
    | "snowball_run_strength_per_successful_break"
    | "dupre_strength_counter_and_last_fort"
    | "set_next_sentry_free_break_after_fully_breaking_wall";
  source: "shared_card_definition" | "card_implementation";
};

function breakMatcherFields(
  matcher: CardIcebreakerBreakMatcherImplementation,
): Pick<
  RuntimeIcebreakerAbility,
  "iceSubtype" | "iceSubtypes" | "selectedIceSubtypeFromBreaker" | "subroutineBreakTags"
> {
  if (matcher.kind === "any") return {};
  if (matcher.kind === "ice_subtype") return { iceSubtype: matcher.subtype };
  if (matcher.kind === "selected_ice_subtype")
    return { selectedIceSubtypeFromBreaker: true };
  if (matcher.kind === "ice_subtype_any_of")
    return { iceSubtypes: [...matcher.subtypes] };
  if (matcher.kind === "subroutine_tag")
    return { subroutineBreakTags: [matcher.tag] };
  return { subroutineBreakTags: ["trace"] };
}

function abilityForImplementation(
  definition: CardDefinition,
  ability: CardIcebreakerAbilityImplementation,
  index: number,
): RuntimeIcebreakerAbility {
  const abilityId = `${definition.id}.card_implementation.icebreaker.${index + 1}.${ability.kind}`;
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
      ...(ability.onUse?.some((effect) => effect.kind === "end_run")
        ? { onUseEndRun: true }
        : {}),
      source: "card_implementation",
    };
  }
  const stealthLoss = ability.onSuccessfulBreak?.find(
    (effect) => effect.kind === "lose_bits_from_stealth_sources",
  );
  return {
    id: abilityId,
    type: "break_subroutine",
    cost: { credits: ability.cost.amount },
    count:
      ability.breakTarget === "all_matching_subroutines"
        ? Number.MAX_SAFE_INTEGER
        : ability.count ?? 1,
    timingPoint: "run.encounter_ice",
    ...(ability.breakTarget === "all_matching_subroutines"
      ? { breakAllMatchingSubroutines: true }
      : {}),
    ...(stealthLoss
      ? {
          postBreakStealthLoss: stealthLoss.amount,
          postBreakStealthLossMode: stealthLoss.mode,
        }
      : {}),
    ...(ability.onUse?.some((effect) => effect.kind === "end_run")
      ? { onUseEndRun: true }
      : {}),
    ...(ability.special ? { special: ability.special.kind } : {}),
    ...breakMatcherFields(ability.matches),
    source: "card_implementation",
  };
}

export function icebreakerAbilitiesForDefinition(
  definition: CardDefinition,
): readonly RuntimeIcebreakerAbility[] {
  const implementation =
    cardImplementationForDefinitionId(definition.id)?.icebreakerAbilities;
  if (implementation?.length)
    return implementation.map((ability, index) =>
      abilityForImplementation(definition, ability, index),
    );
  return (definition.abilities ?? []).map((ability) => ({
    ...ability,
    source: "shared_card_definition" as const,
  }));
}
