import { DEMO_CARDS_BY_ID, type DeckDefinition } from "@netgrid/shared";

import { sortedUnique } from "../runtime/collection";

type SimulationDeckSupportConfig = {
  readonly runnerDeck?: DeckDefinition;
  readonly corpDeck?: DeckDefinition;
};

export function validateSimulationDeckSupport(
  config: SimulationDeckSupportConfig,
): string[] {
  const errors: string[] = [];
  for (const deck of [config.runnerDeck, config.corpDeck]) {
    if (!deck) continue;
    for (const entry of deck.cards) {
      const definition = DEMO_CARDS_BY_ID[entry.id];
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
