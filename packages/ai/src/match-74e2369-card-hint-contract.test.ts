import compiledHints from "../../../data/ai/ai-card-hints-compiled.json";
import { describe, expect, it } from "vitest";

type Effect = Record<string, unknown>;
type Hint = {
  cardId: string;
  effects?: Effect[];
};

const AUDITED_CARDS = [
  "onr_v1_196_corporate-war",
  "onr_v1_222_ball-and-chain",
  "onr_v1_278_wall-of-ice",
] as const;

describe("match 74e2369 deck hint contracts", () => {
  it.each(AUDITED_CARDS)(
    "compiles %s without overlapping effect cores",
    (cardId) => {
      expect(overlappingEffectPairs(hint(cardId).effects ?? []), cardId).toEqual(
        [],
      );
    },
  );

  it("retains Corporate War's distinct economy and counter-economy semantics", () => {
    const kinds = new Set(
      (hint("onr_v1_196_corporate-war").effects ?? []).map(
        (effect) => effect.kind,
      ),
    );

    expect(kinds).toEqual(new Set(["economy", "counter_economy"]));
  });

  it("retains Ball and Chain's future encounter and run-tax semantics", () => {
    const kinds = new Set(
      (hint("onr_v1_222_ball-and-chain").effects ?? []).map(
        (effect) => effect.kind,
      ),
    );

    expect(kinds).toEqual(
      new Set(["future_run_effect", "run_tax", "future_encounter_effect"]),
    );
  });

  it("retains Wall of Ice's damage, protection, and ETR semantics", () => {
    const kinds = new Set(
      (hint("onr_v1_278_wall-of-ice").effects ?? []).map(
        (effect) => effect.kind,
      ),
    );

    expect(kinds).toEqual(new Set(["damage", "remote_protection", "etr"]));
  });
});

function hint(cardId: string): Hint {
  const result = (compiledHints.cards as Hint[]).find(
    (entry) => entry.cardId === cardId,
  );
  if (!result) throw new Error(`Missing compiled hint: ${cardId}`);
  return result;
}

function overlappingEffectPairs(effects: Effect[]): Array<[number, number]> {
  const overlaps: Array<[number, number]> = [];
  for (let left = 0; left < effects.length; left += 1) {
    for (let right = left + 1; right < effects.length; right += 1) {
      if (
        ["kind", "timing", "scope", "resource", "target"].every(
          (field) => effects[left]?.[field] === effects[right]?.[field],
        )
      ) {
        overlaps.push([left, right]);
      }
    }
  }
  return overlaps;
}
