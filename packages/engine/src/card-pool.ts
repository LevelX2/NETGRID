import {
  type DeckDefinition,
  type DeckPublicMetadata,
} from "@netgrid/shared";

export type CardPoolVersion =
  | "0.1.0"
  | "0.4.0"
  | "0.8.0"
  | "0.94.0";

type CardPoolDescriptor = {
  version: CardPoolVersion;
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
    version: "0.94.0",
    snapshotId: "card-snapshot-0.94",
    formatProfileId: "local-demo-v0.94",
    matchesDeck: (deck) =>
      deck.id.endsWith("_094") ||
      deck.id.includes("_0_94") ||
      deck.id.includes("_v0_94") ||
      deck.cards.some(
        (card) =>
          card.id.startsWith("onr_v1_") ||
          card.id.startsWith("onr_proteus_") ||
          card.id.startsWith("onr_classic_"),
      ),
  },
  {
    version: "0.8.0",
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
    snapshotId: "card-snapshot-0.5",
    formatProfileId: "local-demo-v0.6",
    matchesDeck: (deck) =>
      deck.id.endsWith("_004") ||
      deck.id.includes("_0_6") ||
      deck.cards.some((card) => EXPANDED_CARD_POOL_IDS.has(card.id)),
  },
  {
    version: "0.1.0",
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
