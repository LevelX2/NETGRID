import type { DeckPublicMetadata, Side } from "@netgrid/shared";

export type AiDeckStrategyDeckSnapshot = {
  deckSnapshotId: string;
  sourceDeckId?: string;
  side: Side;
  cardPoolSnapshotId?: string;
  formatProfileId?: string;
  deckHash?: string;
  publicMetadata?: DeckPublicMetadata;
  cards: Array<{ cardId: string; quantity: number }>;
};
