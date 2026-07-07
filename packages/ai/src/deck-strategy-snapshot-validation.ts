import type { Side } from "@netgrid/shared";
import { RUNTIME_CARDS } from "./ai-hints";
import type { AiDeckStrategyDeckSnapshot } from "./deck-strategy-snapshot";

export type AiDeckSnapshotRuntimeErrorCode =
  | "ai_deck_snapshot_missing"
  | "ai_deck_snapshot_empty"
  | "ai_deck_snapshot_side_mismatch"
  | "ai_deck_snapshot_unknown_card"
  | "ai_deck_snapshot_invalid"
  | "ai_deck_snapshot_stale";

export type AiDeckSnapshotRuntimeExpectation = {
  side: Side;
  deckSnapshotId?: string;
  cardPoolSnapshotId?: string;
  formatProfileId?: string;
  deckHash?: string;
};

export class AiDeckSnapshotRuntimeError extends Error {
  readonly code: AiDeckSnapshotRuntimeErrorCode;
  readonly details: string[];

  constructor(
    code: AiDeckSnapshotRuntimeErrorCode,
    message: string,
    details: readonly string[] = [],
  ) {
    super(`${code}: ${message}`);
    this.name = "AiDeckSnapshotRuntimeError";
    this.code = code;
    this.details = [...details];
  }
}

export function assertValidAiDeckSnapshotForRuntime(
  snapshot: AiDeckStrategyDeckSnapshot | undefined,
  expectation: AiDeckSnapshotRuntimeExpectation,
): AiDeckStrategyDeckSnapshot {
  if (!snapshot) {
    throw new AiDeckSnapshotRuntimeError(
      "ai_deck_snapshot_missing",
      `Missing ownDeckSnapshot for ${expectation.side}.`,
    );
  }

  if (!isNonEmptyString(snapshot.deckSnapshotId)) {
    throw new AiDeckSnapshotRuntimeError(
      "ai_deck_snapshot_invalid",
      "Deck snapshot id is missing.",
    );
  }

  if (snapshot.side !== expectation.side) {
    throw new AiDeckSnapshotRuntimeError(
      "ai_deck_snapshot_side_mismatch",
      `Deck snapshot ${snapshot.deckSnapshotId} has side ${snapshot.side}, expected ${expectation.side}.`,
    );
  }

  if (
    snapshot.publicMetadata?.side !== undefined &&
    snapshot.publicMetadata.side !== snapshot.side
  ) {
    throw new AiDeckSnapshotRuntimeError(
      "ai_deck_snapshot_invalid",
      `Deck snapshot ${snapshot.deckSnapshotId} public metadata side does not match snapshot side.`,
      [`public_side:${snapshot.publicMetadata.side}`, `side:${snapshot.side}`],
    );
  }

  if (!Array.isArray(snapshot.cards)) {
    throw new AiDeckSnapshotRuntimeError(
      "ai_deck_snapshot_invalid",
      `Deck snapshot ${snapshot.deckSnapshotId} cards are not an array.`,
    );
  }

  if (snapshot.cards.length === 0) {
    throw new AiDeckSnapshotRuntimeError(
      "ai_deck_snapshot_empty",
      `Deck snapshot ${snapshot.deckSnapshotId} contains no cards.`,
    );
  }

  for (const entry of snapshot.cards) {
    if (!isNonEmptyString(entry.cardId)) {
      throw new AiDeckSnapshotRuntimeError(
        "ai_deck_snapshot_invalid",
        `Deck snapshot ${snapshot.deckSnapshotId} contains a card entry without cardId.`,
      );
    }
    if (
      !Number.isInteger(entry.quantity) ||
      entry.quantity <= 0 ||
      entry.quantity > 99
    ) {
      throw new AiDeckSnapshotRuntimeError(
        "ai_deck_snapshot_invalid",
        `Deck snapshot ${snapshot.deckSnapshotId} has invalid quantity for ${entry.cardId}.`,
        [`card:${entry.cardId}`, `quantity:${entry.quantity}`],
      );
    }
    const runtimeCard = RUNTIME_CARDS[entry.cardId];
    if (!runtimeCard) {
      throw new AiDeckSnapshotRuntimeError(
        "ai_deck_snapshot_unknown_card",
        `Deck snapshot ${snapshot.deckSnapshotId} references unknown runtime card ${entry.cardId}.`,
        [`card:${entry.cardId}`],
      );
    }
    if (runtimeCard.side !== snapshot.side) {
      throw new AiDeckSnapshotRuntimeError(
        "ai_deck_snapshot_invalid",
        `Deck snapshot ${snapshot.deckSnapshotId} contains wrong-side card ${entry.cardId}.`,
        [`card:${entry.cardId}`, `card_side:${runtimeCard.side}`, `snapshot_side:${snapshot.side}`],
      );
    }
  }

  assertInternalMetadataConsistency(snapshot);
  assertExpectedMetadata(snapshot, expectation);
  return snapshot;
}

export function isAiDeckSnapshotRuntimeError(
  error: unknown,
): error is AiDeckSnapshotRuntimeError {
  return error instanceof AiDeckSnapshotRuntimeError;
}

function assertInternalMetadataConsistency(
  snapshot: AiDeckStrategyDeckSnapshot,
): void {
  const topLevelCardPool = snapshot.cardPoolSnapshotId;
  const publicCardPool = snapshot.publicMetadata?.cardPoolSnapshotId;
  if (
    topLevelCardPool !== undefined &&
    publicCardPool !== undefined &&
    topLevelCardPool !== publicCardPool
  ) {
    throw new AiDeckSnapshotRuntimeError(
      "ai_deck_snapshot_invalid",
      `Deck snapshot ${snapshot.deckSnapshotId} card pool metadata is inconsistent.`,
      [`card_pool:${topLevelCardPool}`, `public_card_pool:${publicCardPool}`],
    );
  }

  const topLevelFormat = snapshot.formatProfileId;
  const publicFormat = snapshot.publicMetadata?.formatProfileId;
  if (
    topLevelFormat !== undefined &&
    publicFormat !== undefined &&
    topLevelFormat !== publicFormat
  ) {
    throw new AiDeckSnapshotRuntimeError(
      "ai_deck_snapshot_invalid",
      `Deck snapshot ${snapshot.deckSnapshotId} format metadata is inconsistent.`,
      [`format:${topLevelFormat}`, `public_format:${publicFormat}`],
    );
  }

  const topLevelHash = snapshot.deckHash;
  const publicHash = snapshot.publicMetadata?.deckHash;
  if (
    topLevelHash !== undefined &&
    publicHash !== undefined &&
    topLevelHash !== publicHash
  ) {
    throw new AiDeckSnapshotRuntimeError(
      "ai_deck_snapshot_invalid",
      `Deck snapshot ${snapshot.deckSnapshotId} hash metadata is inconsistent.`,
      [`deck_hash:${topLevelHash}`, `public_deck_hash:${publicHash}`],
    );
  }
}

function assertExpectedMetadata(
  snapshot: AiDeckStrategyDeckSnapshot,
  expectation: AiDeckSnapshotRuntimeExpectation,
): void {
  const mismatches: string[] = [];
  if (
    expectation.deckSnapshotId !== undefined &&
    snapshot.deckSnapshotId !== expectation.deckSnapshotId
  ) {
    mismatches.push(
      `deckSnapshotId:${snapshot.deckSnapshotId}!=${expectation.deckSnapshotId}`,
    );
  }

  compareOptionalMetadata(
    mismatches,
    "cardPoolSnapshotId",
    snapshot.cardPoolSnapshotId ?? snapshot.publicMetadata?.cardPoolSnapshotId,
    expectation.cardPoolSnapshotId,
  );
  compareOptionalMetadata(
    mismatches,
    "formatProfileId",
    snapshot.formatProfileId ?? snapshot.publicMetadata?.formatProfileId,
    expectation.formatProfileId,
  );
  compareOptionalMetadata(
    mismatches,
    "deckHash",
    snapshot.deckHash ?? snapshot.publicMetadata?.deckHash,
    expectation.deckHash,
  );

  if (mismatches.length > 0) {
    throw new AiDeckSnapshotRuntimeError(
      "ai_deck_snapshot_stale",
      `Deck snapshot ${snapshot.deckSnapshotId} does not match expected runtime deck metadata.`,
      mismatches,
    );
  }
}

function compareOptionalMetadata(
  mismatches: string[],
  field: string,
  actual: string | undefined,
  expected: string | undefined,
): void {
  if (expected === undefined) return;
  if (actual !== expected) mismatches.push(`${field}:${actual ?? "missing"}!=${expected}`);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
