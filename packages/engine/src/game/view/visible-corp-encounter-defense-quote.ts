import type {
  GameState,
  LegalAction,
  VisibleCard,
  VisibleCorpEncounterDefenseQuote,
} from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { activatedAbilityBindingForLegalAction } from "../../ability-engine/card-capability-binding";
import { visibleCurrentIceBreakExchange } from "./visible-rez-resource-exchange-quote";
import { visibleEffectiveIceRunQuote } from "./visible-run-quote";

export function visibleCorpEncounterDefenseQuotes(
  state: GameState,
  ice: VisibleCard,
  actions: readonly LegalAction[],
): VisibleCorpEncounterDefenseQuote[] {
  const run = state.run;
  if (
    state.timingPoint !== "run.encounter_ice" ||
    run?.phase !== "encounter_ice" ||
    run.encounteredIceId !== ice.instanceId ||
    !ice.known ||
    !ice.rezzed ||
    !ice.definitionId
  )
    return [];
  const definition = CARD_DEFINITIONS_BY_ID[ice.definitionId];
  const current = visibleEffectiveIceRunQuote(state, ice.instanceId, ice);
  if (!definition || !current)
    throw new Error("Paid encounter defense has no current ICE authority.");
  const existingUnbrokenEndTheRunCount = current.subroutines.filter(
    (subroutine, index) =>
      subroutine.type === "end_the_run" &&
      !run.brokenSubroutineIndexes.includes(index) &&
      !run.resolvedSubroutineIndexes.includes(index) &&
      !run.ignoredSubroutineIndexes?.includes(index),
  ).length;
  return actions.flatMap((action) => {
    if (
      action.side !== "corp" ||
      action.type !== "activated_card_ability" ||
      action.source !== ice.instanceId ||
      action.expiresAtStateVersion !== state.stateVersion ||
      action.payload?.cardImplementationAbilityTiming !== "corp_encounter"
    )
      return [];
    const { ability } = activatedAbilityBindingForLegalAction(
      definition,
      action,
    );
    if (
      ability.effects.length !== 1 ||
      ability.effects[0]?.kind !==
        "add_current_encounter_additional_subroutine" ||
      ability.effects[0].subroutine.kind !== "end_the_run" ||
      ability.effects[0].target !== "encountered_ice_self" ||
      ability.costs.some((cost) => cost.kind !== "credit")
    )
      return [];
    const creditCost = ability.costs.reduce(
      (sum, cost) => sum + (cost.kind === "credit" ? cost.amount : 0),
      0,
    );
    if (!Number.isSafeInteger(creditCost) || creditCost < 0)
      throw new Error("Paid encounter defense has an invalid credit cost.");
    const exchange = visibleCurrentIceBreakExchange(
      state,
      ice.instanceId,
      ice,
      current,
      1,
    );
    return [
      {
        actionId: action.actionId,
        creditCost,
        existingUnbrokenEndTheRunCount,
        exchange,
      },
    ];
  });
}
