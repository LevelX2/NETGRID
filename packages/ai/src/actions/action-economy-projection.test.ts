import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";

describe("action economy projection", () => {
  it("projects the basic credit action as a guaranteed liquid +1", () => {
    const projection = project(
      legalAction("basic-credit", "gain_credit", {
        source: "basic_action",
        payload: { gainCreditsAmount: 1 },
      }),
    );

    expect(projection).toMatchObject({
      kind: "immediate_liquid",
      timing: "immediate",
      clickCost: 1,
      creditCost: 0,
      grossLiquidCreditGain: 1,
      netLiquidCreditGain: 1,
      cardsDrawn: 0,
      cardsConsumed: 0,
      netHandDelta: 0,
      reliability: "guaranteed",
      source: "legal_action_payload",
      confidence: "high",
    });
  });

  it("projects scored and installed abilities from their payload, not action type", () => {
    const coup = project(
      legalAction("coup", "activated_card_ability", {
        payload: { gainCreditsAmount: 3 },
      }),
    );
    const bbs = project(
      legalAction("bbs", "activated_card_ability", {
        payload: {
          gainCreditsAmount: 2,
          cardImplementationTakesHostedCredits: true,
          hostedCreditTakeAmount: 2,
        },
      }),
    );

    expect(coup).toMatchObject({
      kind: "immediate_liquid",
      grossLiquidCreditGain: 3,
      netLiquidCreditGain: 3,
    });
    expect(bbs).toMatchObject({
      kind: "immediate_liquid",
      grossLiquidCreditGain: 2,
      storedCreditsTaken: 2,
      payoutMode: "fixed",
    });
  });

  it("separates Broker load from its dynamic cashout", () => {
    const load = project(
      legalAction("broker-load", "activated_card_ability", {
        payload: {
          cardImplementationAddsHostedCredits: true,
          hostedCreditAddAmount: 3,
        },
      }),
    );
    const cashout = project(
      legalAction("broker-cashout", "activated_card_ability", {
        payload: {
          gainCreditsAmount: 12,
          cardImplementationTakesHostedCredits: true,
          hostedCreditTakeAmount: 12,
          hostedCreditTakeMode: "all",
        },
      }),
    );

    expect(load).toMatchObject({
      kind: "stored_credit_build",
      timing: "setup",
      storedCreditsAdded: 3,
    });
    expect(load).not.toHaveProperty("grossLiquidCreditGain");
    expect(cashout).toMatchObject({
      kind: "immediate_liquid",
      grossLiquidCreditGain: 12,
      storedCreditsTaken: 12,
      payoutMode: "all_available",
    });
  });

  it("uses the net hand delta for a played +2 credit and draw-one action", () => {
    const projection = project(
      legalAction("mixed-operation", "play_operation", {
        payload: { gainCreditsAmount: 2, drawCardsAmount: 1 },
      }),
    );

    expect(projection).toMatchObject({
      grossLiquidCreditGain: 2,
      cardsDrawn: 1,
      cardsConsumed: 1,
      netHandDelta: 0,
    });
  });

  it("does not turn an explicitly non-credit wrapper into economy", () => {
    const projection = project(
      legalAction("wrapper", "gain_credit", {
        source: "basic_action",
        payload: {
          gainCreditsAmount: 0,
          effectKind: "hidden_zone",
        },
      }),
    );

    expect(projection).toMatchObject({
      kind: "non_economy",
      reliability: "unknown",
      confidence: "none",
    });
    expect(projection).not.toHaveProperty("grossLiquidCreditGain");
  });

  it("subtracts action credit costs exactly once from immediate liquidity", () => {
    const projection = project(
      legalAction("paid-credit", "activated_card_ability", {
        costs: [{ clicks: 1, credits: 2 }],
        payload: { gainCreditsAmount: 5 },
      }),
    );

    expect(projection).toMatchObject({
      creditCost: 2,
      grossLiquidCreditGain: 5,
      netLiquidCreditGain: 3,
    });
  });
});

function project(action: LegalAction) {
  const [candidate] = buildActionSemanticCandidates({
    legalActions: [action],
    observerSide: action.side,
  });
  if (!candidate?.economyProjection) {
    throw new Error("Expected economy projection");
  }
  return candidate.economyProjection;
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  overrides: Partial<LegalAction> = {},
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    label: actionId,
    source: "test",
    timingPoint: "corp_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    ...overrides,
  };
}
