import { describe, expect, it } from "vitest";
import type {
  ActionEconomyProjection,
  ActionSemanticCandidate,
} from "../action-semantic-candidate";
import {
  economyProjectionAccountsForCreditCost,
  economyRuntimeScoreComponents,
} from "./economy-score-components";

describe("economy runtime score components", () => {
  it("uses the same credit base component for Runner and Corp", () => {
    expect(
      (["runner", "corp"] as const).map(
        (side) => economyRuntimeScoreComponents(candidate(side, 3))[0],
      ),
    ).toEqual([
      expect.objectContaining({ key: "economy_credit_base", value: 200 }),
      expect.objectContaining({ key: "economy_credit_base", value: 200 }),
    ]);
  });

  it("publishes bounded mixed-action hand value", () => {
    expect(
      economyRuntimeScoreComponents(
        candidate("corp", 2, { cardsDrawn: 2, netHandDelta: 1 }),
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "economy_credit_base", value: 150 }),
        expect.objectContaining({ key: "economy_net_hand_delta", value: 40 }),
      ]),
    );
  });

  it("marks immediate net gain as the single credit-cost accounting site", () => {
    expect(
      economyProjectionAccountsForCreditCost(
        candidate("runner", 3, { creditCost: 2, netLiquidCreditGain: 1 }),
      ),
    ).toBe(true);
  });
});

function candidate(
  actorSide: "runner" | "corp",
  grossGain: number,
  overrides: Partial<ActionEconomyProjection> = {},
): ActionSemanticCandidate {
  return {
    actionId: `${actorSide}-economy`,
    actionType: "activated_card_ability",
    actorSide,
    economyProjection: {
      schemaVersion: "action-economy-projection-v1",
      kind: "immediate_liquid",
      timing: "immediate",
      creditRestriction: "general",
      clickCost: 1,
      creditCost: 0,
      grossLiquidCreditGain: grossGain,
      netLiquidCreditGain: grossGain,
      cardsDrawn: 0,
      cardsConsumed: 0,
      netHandDelta: 0,
      payoutMode: "fixed",
      repeatable: false,
      reliability: "guaranteed",
      source: "legal_action_payload",
      confidence: "high",
      evidence: [],
      ...overrides,
    },
  } as unknown as ActionSemanticCandidate;
}
