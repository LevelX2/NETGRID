import { DEMO_DECKS, type DeckDefinition } from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../card-definitions";

export const CARD_REGISTRY_RETENTION_STRESS_IDS = Object.freeze([
  "onr_classic_005_baskerville",
  "onr_classic_019_indiscriminate-response-team",
  "onr_classic_020_london-city-grid",
  "onr_classic_022_self-destruct",
  "onr_classic_024_sterdroid",
  "onr_classic_031_rent-i-con",
  "onr_classic_039_library-search",
  "onr_classic_044_crash-space",
  "onr_classic_047_little-black-box",
  "onr_classic_051_vintage-camaro",
]);
export const CARD_REGISTRY_RETENTION_LEGACY_CONTROL_IDS = Object.freeze([
  "onr_proteus_014_chihuahua",
  "onr_v1_336_rescheduler",
  "onr_proteus_063_lisa-blight",
  "onr_proteus_060_herman-revista",
  "onr_proteus_062_lesley-major",
  "onr_proteus_109_frame-up",
  "onr_proteus_134_cortical-cybermodem",
  "onr_proteus_135_cortical-stimulators",
  "onr_proteus_090_highlighter",
  "v099_host_resource",
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
