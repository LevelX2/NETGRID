import { describe, expect, it } from "vitest";

import activeHints from "../../../data/ai/ai-card-hints-active.json";
import compiledHints from "../../../data/ai/ai-card-hints-compiled.json";
import inspectorIndex from "../../../data/ai/ai-hint-inspector-index.json";

const VIACOX = "onr_proteus_131_bargain-with-viacox";
const SKULLCAP = "onr_proteus_096_skullcap";

type Hint = {
  cardId: string;
  riskTags?: string[];
  effects?: Array<{
    kind: string;
    timing?: string;
    scope?: string;
    resource?: string;
    target?: string;
    damageTypes?: string[];
  }>;
};

describe("match 23D6 card-hint contract", () => {
  it.each([
    ["active", activeHints.cards],
    ["compiled", compiledHints.cards],
  ])("models Viacox as mandatory random action risk, not stack search, in %s hints", (_source, cards) => {
    const viacox = hint(cards as Hint[], VIACOX);

    expect(viacox.riskTags).toEqual(
      expect.arrayContaining(["mandatory_action", "random_outcome"]),
    );
    expect(viacox.effects).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "search", target: "setup.draw" }),
      ]),
    );
  });

  it("publishes Viacox risk signals without a false search signal", () => {
    const viacox = inspectorIndex.cards.find((entry) => entry.cardId === VIACOX);

    expect(viacox?.derivedFunctionSignals).toEqual(
      expect.arrayContaining(["risk.mandatory_action", "risk.random_action"]),
    );
    expect(viacox?.derivedFunctionSignals).not.toContain("setup.search");
  });

  it("normalizes Skullcap's typed damage prevention to one compiled generic effect", () => {
    const skullcap = hint(compiledHints.cards as Hint[], SKULLCAP);
    const genericDamagePrevention = skullcap.effects?.filter(
      (effect) =>
        effect.kind === "damage_prevention" &&
        effect.timing === "prevention_window" &&
        effect.scope === "runner" &&
        effect.resource === "damage",
    );

    expect(genericDamagePrevention).toHaveLength(1);
    expect(genericDamagePrevention?.[0]?.damageTypes?.sort()).toEqual([
      "brain",
      "net",
    ]);
  });
});

function hint(hints: Hint[], cardId: string): Hint {
  const result = hints.find((entry) => entry.cardId === cardId);
  if (!result) throw new Error(`Missing hint: ${cardId}`);
  return result;
}
