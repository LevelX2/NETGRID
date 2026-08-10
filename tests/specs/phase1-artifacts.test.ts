import { describe, expect, it } from "vitest";
import { loadCardSets } from "../../packages/catalog/src/card-set-loader";

const ACTIVE_SET_IDS = [
  "testset",
  "originalset-v1",
  "proteus",
  "classic",
] as const;

describe("active card set artifacts", () => {
  it("keeps exactly one canonical card/support projection per active set", () => {
    expect(loadCardSets().map(({ set }) => set.setId)).toEqual(ACTIVE_SET_IDS);
  });

  it("uses the current card-set and card-support schemas", () => {
    for (const { set: cardSet, support: supportSet } of loadCardSets()) {
      const setId = cardSet.setId;
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
      loadCardSets().map(({ set }) => [set.setId, set.cards.length]),
    );
    expect(counts).toEqual({
      testset: 38,
      "originalset-v1": 374,
      proteus: 154,
      classic: 54,
    });
  });
});
