import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { actionCreditCost } from "./action-cost";
import { runnerCreditNeedScoreComponents } from "./runner-credit-need-score";

describe("runnerCreditNeedScoreComponents", () => {
  it("keeps the established funding bonus on the basic credit action", () => {
    const components = score(
      action({
        actionId: "runner.gain_credit",
        type: "gain_credit",
        source: "basic_action",
        costs: [{ clicks: 1 }],
      }),
    );

    expect(components.map((component) => component.key)).toEqual([
      "runner_low_credits",
      "runner_hand_funding_target",
    ]);
  });

  it("applies funding need to a strictly higher-yield credit ability", () => {
    const components = score(
      action({
        type: "activated_card_ability",
        payload: { gainCreditsAmount: 2 },
        costs: [{ clicks: 1 }],
      }),
    );

    expect(components.map((component) => component.key)).toEqual([
      "runner_low_credits",
      "runner_hand_funding_target",
    ]);
    expect(components[0]?.reason).toContain("net_gain:2|click_cost:1");
  });

  it("does not call a two-click gain of two credits dominant", () => {
    expect(
      score(
        action({
          type: "activated_card_ability",
          payload: { gainCreditsAmount: 2 },
          costs: [{ clicks: 2 }],
        }),
      ),
    ).toEqual([]);
  });

  it("does not extend funding need to a one-credit ability", () => {
    expect(
      score(
        action({
          type: "activated_card_ability",
          payload: { gainCreditsAmount: 1 },
          costs: [{ clicks: 1 }],
        }),
      ),
    ).toEqual([]);
  });

  it("uses net yield after credit costs", () => {
    expect(
      score(
        action({
          type: "play_event",
          payload: { gainCreditsAmount: 3 },
          costs: [{ clicks: 1, credits: 2 }],
        }),
      ),
    ).toEqual([]);
  });

  it("does not duplicate the dedicated value of a hosted-credit cashout", () => {
    expect(
      score(
        action({
          type: "activated_card_ability",
          payload: {
            cardImplementationTakesHostedCredits: true,
            gainCreditsAmount: 3,
          },
          costs: [{ clicks: 1 }],
        }),
      ),
    ).toEqual([]);
  });
});

function score(actionToScore: LegalAction) {
  return runnerCreditNeedScoreComponents(input(), actionToScore, {
    handFundingTarget: () => ({ value: 900, reason: "funding:test" }),
    creditYield: {
      sourceDefinitionIdForAction: () => undefined,
      hintForDefinitionId: () => undefined,
      actionCreditCost,
    },
  });
}

function input(): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      own: { credits: 2 },
    },
  } as AiDecisionInput;
}

function action(overrides: Partial<LegalAction>): LegalAction {
  return {
    actionId: "runner-credit-action",
    side: "runner",
    type: "activated_card_ability",
    label: "Credit action",
    source: "runner-source",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    ...overrides,
  } as LegalAction;
}
