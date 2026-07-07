import type { DeckPublicMetadata, Side } from "@netgrid/shared";

export type AiDeckStrategyDeckSnapshot = {
  deckSnapshotId: string;
  side: Side;
  formatProfileId?: string;
  publicMetadata?: DeckPublicMetadata;
  cards: Array<{ cardId: string; quantity: number }>;
};
