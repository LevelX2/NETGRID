import {
  CURRENT_RULES_BASELINE,
  type DeckDefinition,
  type DeckPublicMetadata,
  type RulesBaseline,
} from "@netgrid/shared";

export type CardPoolVersion =
  | "0.1.0"
  | "0.4.0"
  | "0.8.0"
  | "0.94.0"
  | "0.95.0"
  | "0.96.0"
  | "0.97.0"
  | "0.98.0"
  | "0.99.0";

type CardPoolDescriptor = {
  version: CardPoolVersion;
  baseline: RulesBaseline;
  snapshotId: string;
  formatProfileId: string;
  matchesDeck: (deck: DeckDefinition) => boolean;
};

const EXPANDED_CARD_POOL_IDS = new Set([
  "simple_draw_event",
  "simple_setup_hardware",
  "efficient_fracter",
  "simple_priority_agenda",
  "simple_draw_operation",
  "simple_taxing_barrier_ice",
  "simple_upgrade",
  "simple_tag_ice",
  "simple_tag_punishment_operation",
]);

const CARD_POOL_DESCRIPTORS: CardPoolDescriptor[] = [
  {
    version: "0.99.0",
    baseline: CURRENT_RULES_BASELINE,
    snapshotId: "card-snapshot-0.99",
    formatProfileId: "local-demo-v0.99",
    matchesDeck: (deck) =>
      deck.id.endsWith("_099") ||
      deck.id.includes("_0_99") ||
      deck.id.includes("_v0_99") ||
      deck.identity.startsWith("v099_") ||
      deck.cards.some((card) => card.id.startsWith("v099_")),
  },
  {
    version: "0.98.0",
    baseline: CURRENT_RULES_BASELINE,
    snapshotId: "card-snapshot-0.98",
    formatProfileId: "local-demo-v0.98",
    matchesDeck: (deck) =>
      deck.id.endsWith("_098") ||
      deck.id.includes("_0_98") ||
      deck.id.includes("_v0_98") ||
      deck.identity.startsWith("v098_") ||
      deck.cards.some((card) => card.id.startsWith("v098_")),
  },
  {
    version: "0.97.0",
    baseline: CURRENT_RULES_BASELINE,
    snapshotId: "card-snapshot-0.97",
    formatProfileId: "local-demo-v0.97",
    matchesDeck: (deck) =>
      deck.id.endsWith("_097") ||
      deck.id.includes("_0_97") ||
      deck.id.includes("_v0_97") ||
      deck.cards.some((card) => card.id.startsWith("v097_")),
  },
  {
    version: "0.96.0",
    baseline: CURRENT_RULES_BASELINE,
    snapshotId: "card-snapshot-0.96",
    formatProfileId: "local-demo-v0.96",
    matchesDeck: (deck) =>
      deck.id.endsWith("_096") ||
      deck.id.includes("_0_96") ||
      deck.id.includes("_v0_96") ||
      deck.cards.some((card) => card.id.startsWith("v096_")),
  },
  {
    version: "0.95.0",
    baseline: CURRENT_RULES_BASELINE,
    snapshotId: "card-snapshot-0.95",
    formatProfileId: "local-demo-v0.95",
    matchesDeck: (deck) =>
      deck.id.endsWith("_095") ||
      deck.id.includes("_0_95") ||
      deck.id.includes("_v0_95") ||
      deck.cards.some((card) => card.id.startsWith("v095_")),
  },
  {
    version: "0.94.0",
    baseline: CURRENT_RULES_BASELINE,
    snapshotId: "card-snapshot-0.94",
    formatProfileId: "local-demo-v0.94",
    matchesDeck: (deck) =>
      deck.id.endsWith("_094") ||
      deck.id.includes("_0_94") ||
      deck.id.includes("_v0_94") ||
      deck.cards.some(
        (card) =>
          card.id.startsWith("v094_") ||
          card.id.startsWith("onr_v1_") ||
          card.id.startsWith("onr_proteus_"),
      ),
  },
  {
    version: "0.8.0",
    baseline: CURRENT_RULES_BASELINE,
    snapshotId: "card-snapshot-0.8",
    formatProfileId: "local-demo-v0.8",
    matchesDeck: (deck) =>
      deck.id.endsWith("_008") ||
      deck.id.includes("_0_8") ||
      deck.id.includes("_v0_8") ||
      deck.cards.some((card) => card.id.startsWith("v08_")),
  },
  {
    version: "0.4.0",
    baseline: CURRENT_RULES_BASELINE,
    snapshotId: "card-snapshot-0.5",
    formatProfileId: "local-demo-v0.6",
    matchesDeck: (deck) =>
      deck.id.endsWith("_004") ||
      deck.id.includes("_0_6") ||
      deck.cards.some((card) => EXPANDED_CARD_POOL_IDS.has(card.id)),
  },
  {
    version: "0.1.0",
    baseline: CURRENT_RULES_BASELINE,
    snapshotId: "mvp-0.1-demo",
    formatProfileId: "legacy-demo",
    matchesDeck: () => true,
  },
];

export function cardPoolVersionForDecks(
  runnerDeck: DeckDefinition,
  corpDeck: DeckDefinition,
): CardPoolVersion {
  return descriptorForDecks(runnerDeck, corpDeck).version;
}

export function baselineForCardPoolVersion(
  version: CardPoolVersion,
): RulesBaseline {
  return descriptorForVersion(version).baseline;
}

export function metadataForDeck(
  deck: DeckDefinition,
  cardPoolVersion: CardPoolVersion,
): DeckPublicMetadata {
  const descriptor = descriptorForVersion(cardPoolVersion);
  return {
    side: deck.side,
    identityCardId: deck.identity,
    deckName: deck.name,
    cardPoolSnapshotId: descriptor.snapshotId,
    formatProfileId: descriptor.formatProfileId,
    deckHash: `legacy:${deck.id}`,
  };
}

function descriptorForDecks(
  runnerDeck: DeckDefinition,
  corpDeck: DeckDefinition,
): CardPoolDescriptor {
  return (
    CARD_POOL_DESCRIPTORS.find(
      (descriptor) =>
        descriptor.matchesDeck(runnerDeck) || descriptor.matchesDeck(corpDeck),
    ) ?? descriptorForVersion("0.1.0")
  );
}

function descriptorForVersion(version: CardPoolVersion): CardPoolDescriptor {
  return (
    CARD_POOL_DESCRIPTORS.find((descriptor) => descriptor.version === version) ??
    CARD_POOL_DESCRIPTORS[CARD_POOL_DESCRIPTORS.length - 1]!
  );
}
