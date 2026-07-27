import {
  CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION,
  type CardInstanceId,
  type GameState,
  type VisibleCorpCounterBankPreparationQuote,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import type { CardImplementationDefinition } from "../../card-implementations/types";
import { definitionFor } from "./card-view";

/**
 * Projects a narrow, declarative counter-bank capability from the card's
 * implementation. It never predicts a later action: once a card has been
 * installed, the normal LegalAction producer remains the sole authority for
 * advance, rez, cashout, and counter-transfer actions.
 */
export function visibleCorpCounterBankPreparationQuote(
  state: GameState,
  sourceCardId: CardInstanceId,
): VisibleCorpCounterBankPreparationQuote | undefined {
  const instance = state.cardInstances[sourceCardId];
  if (
    !instance ||
    instance.owner !== "corp" ||
    instance.controller !== "corp"
  ) {
    return undefined;
  }
  const location =
    instance.zone.side === "corp" && instance.zone.zone === "hq"
      ? ({ kind: "corp_hq" } as const)
      : instance.zone.side === "corp" && instance.zone.zone === "serverRoot"
        ? ({
            kind: "installed_root",
            serverId: instance.zone.serverId,
          } as const)
        : undefined;
  if (!location) return undefined;
  const implementation = cardImplementationForDefinitionId(
    definitionFor(state, sourceCardId).id,
  );
  if (
    implementation?.advanceable?.while !== "installed_before_and_after_rez" ||
    !hasCounterCashout(implementation.abilities) ||
    !hasCounterTransfer(implementation.abilities)
  ) {
    return undefined;
  }
  return {
    schemaVersion: CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION,
    context: "corp_counter_bank_preparation",
    sourceCardId,
    expiresAtStateVersion: state.stateVersion,
    location,
    advancementCounters: Math.max(0, Math.floor(instance.advancementCounters)),
    advanceableBeforeRez: true,
    activatedAbilitiesRequireRez: true,
    cashout: {
      advancementCounterCost: 1,
      creditGain: 1,
      actionCost: 0,
    },
    transfer: {
      actionCost: 1,
      minimumSourceCounters: 1,
      source: "source_card",
      target: "chosen_installed_advanceable_card",
      maximum: "all",
    },
  };
}

function hasCounterCashout(
  abilities: CardImplementationDefinition["abilities"],
): boolean {
  return (
    abilities?.some(
      (ability) =>
        ability.kind === "activated" &&
        ability.timing === "corp_main" &&
        ability.condition?.kind === "source_has_advancement_counters" &&
        ability.condition.minimum >= 1 &&
        ability.costs.length === 1 &&
        ability.costs[0]?.kind === "advancement_counter" &&
        ability.costs[0].amount === 1 &&
        ability.costs[0].source === "source" &&
        ability.effects.length === 1 &&
        ability.effects[0]?.kind === "gain_credits" &&
        ability.effects[0].recipient === "controller" &&
        ability.effects[0].amount === 1,
    ) ?? false
  );
}

function hasCounterTransfer(
  abilities: CardImplementationDefinition["abilities"],
): boolean {
  return (
    abilities?.some(
      (ability) =>
        ability.kind === "activated" &&
        ability.timing === "corp_main" &&
        ability.condition?.kind === "source_has_advancement_counters" &&
        ability.condition.minimum >= 1 &&
        ability.costs.length === 1 &&
        ability.costs[0]?.kind === "action" &&
        ability.costs[0].amount === 1 &&
        ability.effects.length === 1 &&
        ability.effects[0]?.kind === "move_advancement_counters" &&
        ability.effects[0].source === "source_card" &&
        ability.effects[0].target === "chosen_installed_advanceable_card" &&
        ability.effects[0].maxAmount === "all",
    ) ?? false
  );
}
