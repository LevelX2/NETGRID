import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const ACTIVE_SET_IDS = ["testset", "originalset-v1", "proteus"] as const;
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

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

describe("active card support visibility contract", () => {
  it("keeps support payloads free of hidden-info and local-path material", () => {
    for (const setId of ACTIVE_SET_IDS) {
      const serialized = readFileSync(
        `data/manifests/${setId}-card-support.json`,
        "utf8",
      );
      for (const pattern of FORBIDDEN_PATTERNS) {
        expect(pattern.test(serialized), `${setId} ${pattern.source}`).toBe(false);
      }
    }
  });

  it("enforces support status invariants", () => {
    for (const setId of ACTIVE_SET_IDS) {
      const supportSet = readJson(`data/manifests/${setId}-card-support.json`) as {
        cards: Array<{
          cardId: string;
          statuses: {
            human_playable?: boolean;
            deck_legal?: boolean;
            format_legal?: boolean;
            ai_supported?: boolean;
            blocked?: boolean;
          };
          support: { aiHintRef: string | null; scenarioRefs: string[] };
          blockReasons?: string[];
        }>;
      };
      for (const entry of supportSet.cards) {
        if (entry.statuses.deck_legal)
          expect(entry.statuses.human_playable, entry.cardId).toBe(true);
        if (entry.statuses.format_legal)
          expect(entry.statuses.deck_legal, entry.cardId).toBe(true);
        if (entry.statuses.ai_supported) {
          expect(entry.statuses.human_playable, entry.cardId).toBe(true);
          expect(entry.statuses.deck_legal, entry.cardId).toBe(true);
          expect(entry.support.aiHintRef, entry.cardId).toBeTruthy();
          expect(entry.support.scenarioRefs.length, entry.cardId).toBeGreaterThan(
            0,
          );
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
