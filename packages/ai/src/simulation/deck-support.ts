import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import { type DeckDefinition } from "@netgrid/shared";

import { sortedUnique } from "../runtime/collection";

type SimulationDeckSupportConfig = {
  readonly runnerDeck?: DeckDefinition;
  readonly corpDeck?: DeckDefinition;
};

export function validateSimulationDeckSupport(
  config: SimulationDeckSupportConfig,
): string[] {
  const errors: string[] = [];
  for (const [side, deck] of [
    ["runner", config.runnerDeck],
    ["corp", config.corpDeck],
  ] as const) {
    if (!deck) continue;
    if (deck.side !== side) {
      errors.push(`Simulation blockiert: Deckseite passt nicht zum ${side}-Slot.`);
      continue;
    }
    const identity = CARD_DEFINITIONS_BY_ID[deck.identity];
    if (!identity || identity.type !== "identity" || identity.side !== side) {
      errors.push(`Simulation blockiert: Ungültige Identität im ${side}-Slot.`);
    }
    for (const entry of deck.cards) {
      const definition = CARD_DEFINITIONS_BY_ID[entry.id];
      if (!definition) {
        errors.push(
          `Simulation blockiert: Karte ${entry.id} ist nicht im Runtime-Katalog.`,
        );
        continue;
      }
      if (definition.implementationStatus !== "playable_mvp") {
        errors.push(
          `Simulation blockiert: Karte ${entry.id} ist nicht als playable_mvp freigegeben.`,
        );
      }
    }
  }
  return sortedUnique(errors);
}
