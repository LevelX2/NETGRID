import {
  RUNNER_DRAW_PROJECTION_SCHEMA_VERSION,
  type LegalAction,
} from "@netgrid/shared";
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

  it("projects an exact resolved-credit quote on a targeted sacrifice ability", () => {
    const projection = project(
      legalAction("ice-cashout", "activated_card_ability", {
        payload: {
          targetCardId: "rezzed-ice",
          gainedCredits: 4,
        },
      }),
    );

    expect(projection).toMatchObject({
      kind: "immediate_liquid",
      grossLiquidCreditGain: 4,
      netLiquidCreditGain: 4,
      source: "legal_action_payload",
      confidence: "high",
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

  it("keeps an engine-certified hosted-credit cashout repeatable only within its finite pool", () => {
    const cashout = project(
      legalAction("short-term-cashout", "activated_card_ability", {
        payload: {
          gainCreditsAmount: 2,
          cardImplementationTakesHostedCredits: true,
          hostedCreditTakeAmount: 2,
          cardImplementationHostedCreditCashOutMaxUses: 6,
        },
      }),
    );

    expect(cashout).toMatchObject({
      kind: "immediate_liquid",
      grossLiquidCreditGain: 2,
      maxCurrentTurnUses: 6,
      repeatable: true,
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

  it("projects the exact basic draw contract even without a redundant payload amount", () => {
    const projection = project(
      legalAction("basic-draw", "draw_card", {
        source: "basic_action",
      }),
    );

    expect(projection).toMatchObject({
      kind: "non_economy",
      timing: "immediate",
      cardsDrawn: 1,
      cardsConsumed: 0,
      netHandDelta: 1,
      repeatable: true,
      reliability: "guaranteed",
      source: "basic_action_contract",
      confidence: "medium",
    });
  });

  it("separates Crash Everett gross draws from net hand growth", () => {
    const projection = project(
      legalAction("basic-draw-with-crash", "draw_card", {
        side: "runner",
        source: "basic_action",
        payload: {
          runnerDrawProjectionSchemaVersion:
            RUNNER_DRAW_PROJECTION_SCHEMA_VERSION,
          projectedGrossDrawCount: 2,
          projectedPostDrawDispositionCount: 1,
          projectedNetHandDelta: 1,
          visibleDrawTaxSourceCount: 1,
        },
      }),
    );

    expect(projection).toMatchObject({
      cardsDrawn: 2,
      cardsConsumed: 0,
      netHandDelta: 1,
      reliability: "guaranteed",
      source: "legal_action_payload",
      confidence: "high",
    });
  });

  it("projects a guaranteed draw event as immediate payload-backed hand progress", () => {
    const projection = project(
      legalAction("draw-three", "play_event", {
        payload: { drawCardsAmount: 3 },
      }),
    );

    expect(projection).toMatchObject({
      kind: "non_economy",
      timing: "immediate",
      cardsDrawn: 3,
      cardsConsumed: 1,
      netHandDelta: 2,
      reliability: "guaranteed",
      source: "legal_action_payload",
      confidence: "high",
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

  it("projects an exact guaranteed root-rez outcome quote as immediate liquid economy", () => {
    const projection = project(rootRezCreditAction());

    expect(projection).toMatchObject({
      kind: "immediate_liquid",
      timing: "immediate",
      creditCost: 1,
      grossLiquidCreditGain: 3,
      netLiquidCreditGain: 2,
      reliability: "guaranteed",
      source: "legal_action_payload",
      confidence: "high",
    });
    expect(projection.evidence).toContain(
      "root_rez_credit_outcome:guaranteed_positive",
    );
  });

  it("does not project a Runner-interruptible root-rez credit outcome as liquid economy", () => {
    const action = rootRezCreditAction();
    action.payload = {
      ...action.payload,
      rootRezCreditOutcomeQuoteResolution: "runner_interruptible",
    };

    const projection = project(action);

    expect(projection).toMatchObject({
      kind: "non_economy",
      reliability: "conditional",
      source: "legal_action_payload",
      confidence: "high",
    });
    expect(projection).not.toHaveProperty("grossLiquidCreditGain");
  });

  it.each([
    [
      "missing",
      (action: LegalAction) => {
        action.payload = {
          cardId: "root-1",
          rootRez: true,
          serverId: "remote_1",
        };
      },
    ],
    [
      "wrong source",
      (action: LegalAction) => {
        action.payload = {
          ...action.payload,
          rootRezCreditOutcomeQuoteSourceCardInstanceId: "root-2",
        };
      },
    ],
    [
      "stale state",
      (action: LegalAction) => {
        action.payload = {
          ...action.payload,
          rootRezCreditOutcomeQuoteStateVersion: 0,
        };
      },
    ],
    [
      "wrong action",
      (action: LegalAction) => {
        action.payload = {
          ...action.payload,
          rootRezCreditOutcomeQuoteActionId: "other-action",
        };
      },
    ],
    [
      "wrong cost",
      (action: LegalAction) => {
        action.payload = {
          ...action.payload,
          rootRezCreditOutcomeQuoteRezCredits: 0,
          rootRezCreditOutcomeQuoteNetCreditGain: 3,
        };
      },
    ],
  ])("fails closed for a %s root-rez outcome quote", (_case, mutate) => {
    const action = rootRezCreditAction();
    mutate(action);

    const projection = project(action);

    expect(projection).toMatchObject({
      kind: "non_economy",
      reliability: "unknown",
      source: "unknown",
      confidence: "none",
    });
    expect(projection).not.toHaveProperty("grossLiquidCreditGain");
  });

  it("keeps a complete but nonpositive root-rez outcome out of immediate economy", () => {
    const action = rootRezCreditAction();
    action.costs = [{ credits: 3 }];
    action.payload = {
      ...action.payload,
      rootRezCreditOutcomeQuoteRezCredits: 3,
      rootRezCreditOutcomeQuoteNetCreditGain: 0,
    };

    const projection = project(action);

    expect(projection).toMatchObject({
      kind: "non_economy",
      reliability: "guaranteed",
      source: "legal_action_payload",
      confidence: "high",
    });
    expect(projection).not.toHaveProperty("grossLiquidCreditGain");
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

function rootRezCreditAction(): LegalAction {
  return legalAction("rez-root-1", "rez_card", {
    source: "root-1",
    timingPoint: "run.movement_rez_window",
    costs: [{ credits: 1 }],
    payload: {
      cardId: "root-1",
      rootRez: true,
      serverId: "remote_1",
      rootRezCreditOutcomeQuoteSchemaVersion:
        "corp-root-rez-credit-outcome-quote-v1",
      rootRezCreditOutcomeQuoteComplete: true,
      rootRezCreditOutcomeQuoteSourceCardInstanceId: "root-1",
      rootRezCreditOutcomeQuoteTargetServerId: "remote_1",
      rootRezCreditOutcomeQuoteStateVersion: 1,
      rootRezCreditOutcomeQuoteTimingPoint: "run.movement_rez_window",
      rootRezCreditOutcomeQuoteActionId: "rez-root-1",
      rootRezCreditOutcomeQuoteResolution: "guaranteed",
      rootRezCreditOutcomeQuoteGrossCreditGain: 3,
      rootRezCreditOutcomeQuoteRezCredits: 1,
      rootRezCreditOutcomeQuoteNetCreditGain: 2,
    },
  });
}
