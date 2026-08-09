import { DEMO_DECKS, type DeckDefinition } from "@netgrid/shared";
import { CS06_CARD_DEFINITION_IDS } from "@netgrid/cards/engine";

import { CARD_DEFINITIONS_BY_ID } from "../card-definitions";

export const CARD_REGISTRY_RETENTION_STRESS_IDS = Object.freeze([
  ...CS06_CARD_DEFINITION_IDS,
]);
export const CARD_REGISTRY_RETENTION_LEGACY_CONTROL_IDS = Object.freeze([
  "onr_proteus_014_chihuahua",
  "onr_proteus_090_highlighter",
  "onr_v1_044_netspace-inverter",
  "onr_proteus_109_frame-up",
  "v099_host_resource",
  "onr_proteus_149_simulacrum",
  "onr_proteus_002_charity-takeover",
  "onr_v1_336_rescheduler",
  "onr_v1_329_investment-firm",
  "onr_proteus_063_lisa-blight",
]);

export function cardRegistryRetentionDecks(lane: "stress" | "legacy"): {
  runnerDeck: DeckDefinition;
  corpDeck: DeckDefinition;
} {
  const definitionIds =
    lane === "stress"
      ? CARD_REGISTRY_RETENTION_STRESS_IDS
      : CARD_REGISTRY_RETENTION_LEGACY_CONTROL_IDS;
  const cardsBySide = { runner: [] as string[], corp: [] as string[] };
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
