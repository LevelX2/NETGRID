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
  strengthDuration?: "current_encounter" | "current_run";
  source: "shared_card_definition" | "card_implementation";
};

function breakMatcherFields(
  matcher: CardIcebreakerBreakMatcherImplementation,
): Pick<RuntimeIcebreakerAbility, "iceSubtype" | "iceSubtypes" | "subroutineBreakTags"> {
  if (matcher.kind === "any") return {};
  if (matcher.kind === "ice_subtype") return { iceSubtype: matcher.subtype };
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
      source: "card_implementation",
    };
  }
  return {
    id: abilityId,
    type: "break_subroutine",
    cost: { credits: ability.cost.amount },
    count: 1,
    timingPoint: "run.encounter_ice",
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
