import activeHints from "../../../data/ai/ai-card-hints-active.json";
import compiledHints from "../../../data/ai/ai-card-hints-compiled.json";
import { describe, expect, it } from "vitest";

type HintEffect = {
  kind: string;
  timing: string;
  scope: string;
  resource?: string;
  amount?: number;
  target?: string;
  finite?: boolean;
};

type HintCard = {
  cardId: string;
  roles: string[];
  planRoles: string[];
  valueHints?: Record<string, number>;
  effects?: HintEffect[];
  breakerProfile?: {
    coverage?: string[];
    breakCost?: number;
    pumpCost?: number;
    scalingStrength?: boolean;
    sideEffects?: string[];
  };
  quality?: {
    hintReviewed?: boolean;
    confidence?: string;
    needsHumanReview?: boolean;
  };
};

const hintSources = [
  ["active", activeHints.cards],
  ["compiled", compiledHints.cards],
] as const;

describe.each(hintSources)("9D15 non-Broker card hints in %s", (_source, cards) => {
  it("keeps HQ-only and R&D-only cards on their actual central", () => {
    const executiveWiretaps = card(cards, "onr_v1_085_executive-wiretaps");
    const rompThroughHq = card(cards, "onr_v1_107_romp-through-hq");
    const rndInterface = card(cards, "onr_v1_139_r-and-d-interface");

    expect(executiveWiretaps.planRoles).toContain("pressure_hq");
    expect(executiveWiretaps.planRoles).not.toContain("pressure_rnd");
    expect(rompThroughHq.planRoles).toContain("pressure_hq");
    expect(rompThroughHq.planRoles).not.toContain("contest_remote");
    expect(rndInterface.roles).toEqual(
      expect.arrayContaining(["hardware", "multiaccess", "rnd_pressure"]),
    );
    expect(rndInterface.planRoles).toEqual(["build_rig", "pressure_rnd"]);
    expect(rndInterface.valueHints).toEqual({ runPressure: 3 });
  });

  it("keeps Score as economy without residual run pressure", () => {
    const score = card(cards, "onr_v1_108_score");

    expect(score.roles).toEqual(["economy"]);
    expect(score.planRoles).toEqual(["recover_economy"]);
    expect(score.valueHints).toEqual({ economy: 5 });
  });

  it.each([
    ["Dwarf", "onr_v1_021_dwarf", "wall", false],
    ["Snowball", "onr_v1_066_snowball", "sentry", true],
  ])(
    "keeps %s as a fully reviewed structured breaker",
    (_name, cardId, coverage, scalingStrength) => {
      const hint = card(cards, cardId);

      expect(hint.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "breaker",
            timing: "persistent",
            scope: "runner",
          }),
        ]),
      );
      expect(hint.breakerProfile).toMatchObject({
        coverage: [coverage],
        breakCost: 1,
        pumpCost: 1,
        ...(scalingStrength
          ? { scalingStrength: true, sideEffects: ["temporary_strength"] }
          : {}),
      });
      expect(hint.quality).toMatchObject({
        hintReviewed: true,
        confidence: "high",
        needsHumanReview: false,
      });
    },
  );

  it.each([
    ["Custodial Position", "onr_v1_081_custodial-position", "rnd"],
    ["Executive Wiretaps", "onr_v1_085_executive-wiretaps", "hq"],
  ])(
    "represents %s additional access exactly once",
    (_name, cardId, scope) => {
      const hint = card(cards, cardId);
      const multiaccess = (hint.effects ?? []).filter(
        (effect) => effect.kind === "multiaccess" && effect.scope === scope,
      );

      expect(multiaccess).toEqual([
        expect.objectContaining({
          timing: "successful_run",
          resource: "cards",
          amount: 2,
        }),
      ]);
    },
  );

  it.each([
    ["Bodyweight Synthetic Blood", "onr_v1_079_bodyweight-synthetic-blood", "draw", 5],
    ["Jack n Joe", "onr_v1_095_jack-n-joe", "draw", 3],
    ["Livewire's Contacts", "onr_v1_097_livewires-contacts", "economy", 3],
    ["Score", "onr_v1_108_score", "economy", 9],
  ])(
    "represents %s's primary effect exactly once",
    (_name, cardId, kind, amount) => {
      const hint = card(cards, cardId);
      const effects = (hint.effects ?? []).filter((effect) => effect.kind === kind);

      expect(effects).toHaveLength(1);
      expect(effects[0]).toMatchObject({ amount });
    },
  );
});

function card(
  cards: readonly unknown[],
  cardId: string,
): HintCard {
  const hint = (cards as HintCard[]).find((candidate) => candidate.cardId === cardId);
  expect(hint, `missing hint ${cardId}`).toBeDefined();
  return hint as HintCard;
}
