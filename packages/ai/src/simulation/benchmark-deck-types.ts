import type {
  DeckDefinition,
  DeckPublicMetadata,
  Side,
} from "@netgrid/shared";

export type AiBenchmarkDeckSlotType =
  | "smoke"
  | "snapshot_tuning"
  | "snapshot_holdout"
  | "local_realistic_holdout"
  | "real_scene_holdout";

export type AiBenchmarkDeckSlotStatus = "runnable" | "disabled" | "pending";

export type AiLocalBenchmarkDeckClassification =
  | "runnable_ai_benchmark"
  | "blocked_by_missing_cards"
  | "blocked_by_unsupported_cards"
  | "blocked_by_ambiguous_mapping"
  | "incomplete"
  | "unclear";

export type AiBenchmarkDeckReference =
  | { kind: "runtime_deck_id"; deckId: string }
  | { kind: "snapshot"; snapshotId: string }
  | { kind: "frozen_local_snapshot"; snapshotId: string }
  | {
      kind: "local_editable_deck";
      localDeckId: string;
      expectedName: string;
      fileName: string;
      baseDir?: string;
    }
  | { kind: "pending_real_scene"; label: string };

export type AiBenchmarkDeckSlotDefinition = {
  slotId: string;
  label: string;
  slotType: AiBenchmarkDeckSlotType;
  status: AiBenchmarkDeckSlotStatus;
  runner: AiBenchmarkDeckReference;
  corp: AiBenchmarkDeckReference;
  tuningUse: "safety_regression" | "progression_tuning" | "holdout_only";
  pendingReason?: string;
};

export type AiBenchmarkSnapshotDeck = {
  snapshotId: string;
  sourceDeckId: string;
  deck: DeckDefinition;
  metadata: DeckPublicMetadata;
};

export type AiBenchmarkLocalEditableDeckResult =
  | {
      ok: true;
      classification: "runnable_ai_benchmark";
      localDeckId: string;
      expectedName: string;
      filePath: string;
      deck: DeckDefinition;
      metadata: DeckPublicMetadata;
      validation: {
        totalCards: number;
        agendaPoints: number | null;
        influenceSpent?: number | null;
      };
      missingCards: string[];
      ambiguousNames: string[];
      unsupportedCards: string[];
      nonDeckLegalCards: string[];
    }
  | {
      ok: false;
      classification: AiLocalBenchmarkDeckClassification;
      localDeckId: string;
      expectedName: string;
      filePath?: string;
      reason: string;
      validationErrors: string[];
      missingCards: string[];
      ambiguousNames: string[];
      unsupportedCards: string[];
      nonDeckLegalCards: string[];
    };

export type DeckSnapshotRecord = {
  deckSnapshotId: string;
  sourceDeckId: string;
  name: string;
  side: Side;
  identityCardId: string;
  cards: Array<{ cardId: string; quantity: number }>;
  publicMetadata?: DeckPublicMetadata;
};

export type FrozenLocalBenchmarkDeckSnapshot = {
  deckSnapshotId: string;
  sourceDeckId: string;
  sourceFileName: string;
  deckVersion: string;
  name: string;
  side: Side;
  identityCardId: string;
  cardPoolSnapshotId: string;
  cardPoolVersion?: string;
  formatProfileId: string;
  formatProfileVersion?: string;
  deckHash: string;
  classification: AiLocalBenchmarkDeckClassification;
  role: string;
  cards: Array<{ cardId: string; quantity: number }>;
};

export type LocalRealisticBenchmarkDeckManifest = {
  schemaVersion: "ai-local-realistic-benchmark-decks-v1";
  storage: {
    kind: "appdata_netgrid_decks";
    relativeDirectory: string;
    overrideEnv: string;
    format: "netgrid-editable-deck-v1";
    cardReference: "cardId";
  };
  frozenSnapshotsFile: string;
  decks: Array<{
    localDeckId: string;
    snapshotId: string;
    expectedName: string;
    side: Side;
    fileName: string;
    classification: AiLocalBenchmarkDeckClassification;
    role: string;
  }>;
  slots: Array<{
    slotId: string;
    label: string;
    slotType: "local_realistic_holdout";
    status: AiBenchmarkDeckSlotStatus;
    runnerLocalDeckId: string;
    corpLocalDeckId: string;
    tuningUse: "holdout_only";
  }>;
};

export type RealSceneBenchmarkDeckManifest = {
  schemaVersion: "ai-real-scene-benchmark-decks-v1";
  storage: {
    kind: "repo_frozen_snapshots";
    format: "netgrid-editable-deck-v1";
    cardReference: "cardId";
    runtimeLiveDeckDependency: boolean;
  };
  frozenSnapshotsFile: string;
  decks: Array<{
    localDeckId: string;
    snapshotId: string;
    expectedName: string;
    side: Side;
    sourceFileName: string;
    classification: AiLocalBenchmarkDeckClassification;
    role: string;
  }>;
  slots: Array<{
    slotId: string;
    label: string;
    slotType: "real_scene_holdout";
    status: AiBenchmarkDeckSlotStatus;
    runnerLocalDeckId: string;
    corpLocalDeckId: string;
    tuningUse: "holdout_only";
    selectionReason?: string;
  }>;
};
