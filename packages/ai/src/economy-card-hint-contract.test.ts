import { describe, expect, it } from "vitest";

import activeHints from "../../../data/ai/ai-card-hints-active.json";

type EconomyEffect = {
  amount?: number;
  amountKind?: string;
  economyMode?: string;
  kind: string;
  resource?: string;
  scope?: string;
  target?: string;
  timing?: string;
};

type EconomyHint = {
  cardId: string;
  effects?: EconomyEffect[];
  functionSignals?: string[];
};

const hints = activeHints.cards as EconomyHint[];

describe("economy card hint contracts", () => {
  it.each([
    ["onr_v1_193_corporate-coup", 3],
    ["onr_v1_195_corporate-retreat", 2],
    ["onr_v1_206_marine-arcology", 3],
    ["onr_v1_209_political-coup", 3],
    ["onr_v1_210_political-overthrow", 3],
  ])("publishes %s as one liquid scored action", (cardId, amount) => {
    const effects = hint(cardId).effects ?? [];
    expect(
      effects.filter(
        (effect) =>
          effect.kind === "action_economy" &&
          effect.timing === "scored_activated" &&
          effect.scope === "corp" &&
          effect.resource === "credits",
      ),
    ).toEqual([
      expect.objectContaining({
        amount,
        economyMode: "liquid_payout",
      }),
    ]);
    expect(
      effects.filter(
        (effect) =>
          ["economy", "counter_economy"].includes(effect.kind) &&
          effect.timing === "scored_activated" &&
          effect.scope === "corp" &&
          effect.resource === "credits",
      ),
    ).toEqual([]);
  });

  it("separates Corporate Coup's payout from its finite 15-credit pool", () => {
    expect(hint("onr_v1_193_corporate-coup").effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          amount: 3,
          economyMode: "liquid_payout",
          kind: "action_economy",
        }),
        expect.objectContaining({
          amount: 15,
          economyMode: "fixed_pool",
          kind: "finite_economy_pool",
          timing: "when_scored",
        }),
      ]),
    );
  });

  it("publishes BBS as one 2-credit payout backed by one finite pool", () => {
    const effects = hint("onr_v1_309_bbs-whispering-campaign").effects ?? [];
    expect(effects).toEqual([
      expect.objectContaining({
        amount: 2,
        economyMode: "liquid_payout",
        kind: "action_economy",
      }),
      expect.objectContaining({
        amount: 16,
        economyMode: "fixed_pool",
        kind: "finite_economy_pool",
      }),
    ]);
  });

  it("models Broker as a voluntary bank rather than a finite pool", () => {
    const broker = hint("onr_v1_154_broker");
    const effects = broker.effects ?? [];
    expect(effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          amount: 3,
          economyMode: "bank_load",
          kind: "counter_economy",
          target: "economy.bank_load",
        }),
        expect.objectContaining({
          amountKind: "all_available",
          economyMode: "bank_cashout",
          kind: "action_economy",
          target: "economy.bank_cashout_all",
        }),
      ]),
    );
    expect(
      effects.some((effect) => effect.kind === "finite_economy_pool"),
    ).toBe(false);
    expect(broker.functionSignals).toEqual(
      expect.arrayContaining([
        "economy.counter",
        "economy.temporary_resource_bank",
      ]),
    );
    expect(
      effects
        .filter(
          (effect) =>
            effect.kind === "counter_economy" &&
            effect.economyMode === "bank_load" &&
            effect.resource === "credits",
        )
        .map((effect) => effect.amount),
    ).toEqual([3]);
  });

  it("matches Department of Truth Enhancement's hosted-credit load and all-cashout contract", () => {
    const effects = hint("onr_v1_318_department-of-truth-enhancement").effects;
    expect(effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          amount: 3,
          amountKind: "fixed",
          economyMode: "bank_load",
          kind: "finite_economy_pool",
          resource: "credits",
        }),
        expect.objectContaining({
          amountKind: "all_available",
          economyMode: "bank_cashout",
          kind: "action_economy",
          resource: "credits",
        }),
      ]),
    );
  });
});

function hint(cardId: string): EconomyHint {
  const result = hints.find((candidate) => candidate.cardId === cardId);
  if (!result) throw new Error(`Missing hint: ${cardId}`);
  return result;
}
