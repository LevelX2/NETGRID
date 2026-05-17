import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const ACTIVE_SET_IDS = ["testset", "originalset-v1", "proteus"] as const;

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

describe("active card set artifacts", () => {
  it("keeps exactly two leading files per active set", () => {
    for (const setId of ACTIVE_SET_IDS) {
      expect(existsSync(`data/cards/${setId}-cards.json`), setId).toBe(true);
      expect(existsSync(`data/manifests/${setId}-card-support.json`), setId).toBe(
        true,
      );
    }
  });

  it("uses the current card-set and card-support schemas", () => {
    for (const setId of ACTIVE_SET_IDS) {
      const cardSet = readJson(`data/cards/${setId}-cards.json`) as {
        schemaVersion: string;
        setId: string;
        cards: Array<{ cardId: string; setId: string }>;
      };
      const supportSet = readJson(`data/manifests/${setId}-card-support.json`) as {
        schemaVersion: string;
        setId: string;
        cards: Array<{ cardId: string; setId: string }>;
      };
      expect(cardSet.schemaVersion).toBe("card-set-v1");
      expect(supportSet.schemaVersion).toBe("card-support-v1");
      expect(cardSet.setId).toBe(setId);
      expect(supportSet.setId).toBe(setId);
      expect(cardSet.cards.map((card) => card.cardId).sort()).toEqual(
        supportSet.cards.map((card) => card.cardId).sort(),
      );
      expect(cardSet.cards.every((card) => card.setId === setId)).toBe(true);
      expect(supportSet.cards.every((card) => card.setId === setId)).toBe(true);
    }
  });

  it("keeps the expected active set sizes", () => {
    const counts = Object.fromEntries(
      ACTIVE_SET_IDS.map((setId) => [
        setId,
        (readJson(`data/cards/${setId}-cards.json`) as { cards: unknown[] })
          .cards.length,
      ]),
    );
    expect(counts).toEqual({
      testset: 38,
      "originalset-v1": 374,
      proteus: 154,
    });
  });
});
