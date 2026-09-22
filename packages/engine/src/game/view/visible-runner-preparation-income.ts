import type { VisibleCard } from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { activatedAbilityBindingsForDefinition } from "../../ability-engine/card-capability-binding";

/** Guaranteed repeatable liquid income from public installed sources. Hidden
 * events, limited payouts and conditional abilities are outside this quote. */
export function visibleRunnerPreparationIncomePerClick(
  rig: readonly VisibleCard[],
): number {
  let income = 1;
  for (const card of rig) {
    if (!card.known || !card.definitionId || card.controller !== "runner")
      continue;
    const definition = CARD_DEFINITIONS_BY_ID[card.definitionId];
    if (!definition) continue;
    for (const { ability } of activatedAbilityBindingsForDefinition(
      definition,
    )) {
      if (
        ability.timing !== "runner_main" ||
        ability.condition ||
        ability.limit ||
        ability.costs.length !== 1 ||
        ability.costs[0]?.kind !== "action" ||
        ability.costs[0].amount !== 1 ||
        ability.effects.length !== 1
      )
        continue;
      const effect = ability.effects[0];
      if (
        effect?.kind === "gain_credits" &&
        (effect.recipient === "runner" || effect.recipient === "controller") &&
        Number.isSafeInteger(effect.amount) &&
        effect.amount > income
      )
        income = effect.amount;
    }
  }
  return income;
}
