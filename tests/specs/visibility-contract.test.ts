import { describe, expect, it } from "vitest";
import { loadCardSets } from "../../packages/catalog/src/card-set-loader";

const FORBIDDEN_PATTERNS = [
  /"sessionToken"\s*:/i,
  /"reconnectToken"\s*:/i,
  /"joinToken"\s*:/i,
  /"tokenHash"\s*:/i,
  /"fullState"\s*:/i,
  /"cardInstances"\s*:/i,
  /"privatePayload"\s*:/i,
  /"stateSnapshots"\s*:/i,
  /"undoSnapshots"\s*:/i,
  /decklist/i,
  /\b[A-Za-z]:\\/,
  /%APPDATA%/i,
  /data[\\/]local/i,
] as const;

describe("active card support visibility contract", () => {
  it("keeps support payloads free of hidden-info and local-path material", () => {
    for (const { support } of loadCardSets()) {
      const serialized = JSON.stringify(support);
      for (const pattern of FORBIDDEN_PATTERNS) {
        expect(
          pattern.test(serialized),
          `${support.setId} ${pattern.source}`,
        ).toBe(false);
      }
    }
  });

  it("enforces support status invariants", () => {
    for (const { support: supportSet } of loadCardSets()) {
      for (const entry of supportSet.cards) {
        if (entry.statuses.deck_legal)
          expect(entry.statuses.human_playable, entry.cardId).toBe(true);
        if (entry.statuses.format_legal)
          expect(entry.statuses.deck_legal, entry.cardId).toBe(true);
        if (entry.statuses.ai_supported) {
          expect(entry.statuses.human_playable, entry.cardId).toBe(true);
          expect(entry.statuses.deck_legal, entry.cardId).toBe(true);
          expect(
            entry.support.aiHintRef !== null ||
              entry.support.coverage.includes("card_spec_registry"),
            entry.cardId,
          ).toBe(true);
          expect(
            entry.support.scenarioRefs.length,
            entry.cardId,
          ).toBeGreaterThan(0);
        }
        if (entry.statuses.blocked) {
          expect(entry.statuses.deck_legal, entry.cardId).toBe(false);
          expect(entry.statuses.format_legal, entry.cardId).toBe(false);
          expect(entry.statuses.ai_supported, entry.cardId).toBe(false);
          expect(entry.blockReasons?.length, entry.cardId).toBeGreaterThan(0);
        }
      }
    }
  });
});
