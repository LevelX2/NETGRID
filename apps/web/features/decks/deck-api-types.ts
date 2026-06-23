import type { DeckPublicMetadata, Side } from "@netgrid/shared";

import type { DeckCardEntry, EditableDeck } from "./deck-table-model";

export type DeckTemplate = {
  templateId: string;
  sourceDeckId: string;
  name: string;
  side: Side;
  identityCardId: string;
  editableCopyAllowed: boolean;
  cards: DeckCardEntry[];
};

export type DeckValidationResult = {
  ok: boolean;
  errors: string[];
  errorCodes?: string[];
  warnings: string[];
  totalCards: number;
  agendaPoints: number | null;
  influenceSpent?: number | null;
};

export type DeckSnapshot = {
  deckSnapshotId: string;
  sourceDeckId: string;
  deckVersion: string;
  name: string;
  side: Side;
  identityCardId: string;
  cardPoolSnapshotId: string;
  cardPoolVersion?: string;
  formatProfileId: string;
  formatProfileVersion?: string;
  rulesBaselineId: string;
  immutable: boolean;
  cards: DeckCardEntry[];
  validation: DeckValidationResult;
  publicMetadata: DeckPublicMetadata;
  deckHash: string;
};

export type DeckSnapshotsResponse = {
  snapshots: DeckSnapshot[];
};

export type DeckTemplatesResponse = {
  templates: DeckTemplate[];
};

export type DeckValidationResponse = {
  validation: DeckValidationResult;
  snapshot: DeckSnapshot | null;
  error?: { message: string };
};

export type DeckLibraryResponse = {
  decks?: EditableDeck[];
  storagePath?: string;
  error?: { message: string };
};
