import compiledHints from "../../../data/ai/ai-card-hints-compiled.json";
import { describe, expect, it } from "vitest";

type Effect = Record<string, unknown>;
type Hint = {
  cardId: string;
  effects?: Effect[];
};

const AUDITED_CARDS = [
  "onr_v1_193_corporate-coup",
  "onr_v1_203_hostile-takeover",
  "onr_v1_206_marine-arcology",
  "onr_v1_281_accounts-receivable",
  "onr_v1_285_closed-accounts",
  "onr_v1_290_efficiency-experts",
  "onr_v1_295_night-shift",
  "onr_v1_297_overtime-incentives",
  "onr_v1_302_scorched-earth",
  "onr_v1_366_red-herrings",
] as const;

describe("latest two Corp match deck hint contracts", () => {
  it.each(AUDITED_CARDS)(
    "compiles %s without overlapping effect cores",
    (cardId) => {
      const effects = hint(cardId).effects ?? [];
      expect(overlappingEffectPairs(effects), cardId).toEqual([]);
    },
  );

  it("retains Night Shift's distinct economy and draw semantics", () => {
    const kinds = new Set(
      (hint("onr_v1_295_night-shift").effects ?? []).map(
        (effect) => effect.kind,
      ),
    );

    expect(kinds).toEqual(new Set(["economy", "draw"]));
  });

  it("retains Scorched Earth's damage and tag-punish semantics", () => {
    const kinds = new Set(
      (hint("onr_v1_302_scorched-earth").effects ?? []).map(
        (effect) => effect.kind,
      ),
    );

    expect(kinds).toEqual(new Set(["damage", "tag_punish_payoff"]));
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
