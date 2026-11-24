import { DEMO_DECKS, type CardDefinitionId, type DeckDefinition } from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../card-definitions";

export const CARD_REGISTRY_RETENTION_STRESS_IDS = Object.freeze([
  9,
  23,
  24,
  26,
  28,
  35,
  43,
  48,
  51,
  55,
]);
export const CARD_REGISTRY_RETENTION_CARD_SPEC_CONTROL_IDS = Object.freeze([
  72,
  548,
  121,
  118,
  120,
  167,
  192,
  193,
  148,
  366,
]);

export function cardRegistryRetentionDecks(lane: "stress" | "control"): {
  runnerDeck: DeckDefinition;
  corpDeck: DeckDefinition;
} {
  const definitionIds =
    lane === "stress"
      ? CARD_REGISTRY_RETENTION_STRESS_IDS
      : CARD_REGISTRY_RETENTION_CARD_SPEC_CONTROL_IDS;
  const cardsBySide = {
    runner: [] as CardDefinitionId[],
    corp: [] as CardDefinitionId[],
  };
  for (const definitionId of definitionIds) {
    const definition = CARD_DEFINITIONS_BY_ID[definitionId];
    if (!definition)
      throw new Error(`retention_fixture_missing_definition:${definitionId}`);
    cardsBySide[definition.side].push(definitionId);
  }
  return {
    runnerDeck: {
      ...DEMO_DECKS.demo_runner_001,
      id: "registry_retention_runner",
      name: "Registry Retention Runner",
      cards: cardsBySide.runner.map((id) => ({ id, quantity: 3 })),
    },
    corpDeck: {
      ...DEMO_DECKS.demo_corp_001,
      id: "registry_retention_corp",
      name: "Registry Retention Corp",
      cards: cardsBySide.corp.map((id) => ({ id, quantity: 3 })),
    },
  };
}
