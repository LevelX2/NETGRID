import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { ResidentPlanPortfolio } from "./resident-plan-portfolio";
import {
  corpExactCurrentBasicLiquidCreditCandidate,
  corpTurnLiquidityDevelopmentNeed,
  corpVisibleLiquidityDemandTarget,
} from "./corp-economy-domain-signals";

describe("corp economy domain signals", () => {
  it("requires the exact current basic-credit LegalAction contract", () => {
    const input = decisionInput();
    const candidate = basicCreditCandidate();

    expect(corpExactCurrentBasicLiquidCreditCandidate(input, candidate)).toBe(
      true,
    );
    expect(
      corpExactCurrentBasicLiquidCreditCandidate(
        {
          ...input,
          playerView: {
            ...input.playerView,
            stateVersion: input.playerView.stateVersion + 1,
          },
        },
        candidate,
      ),
    ).toBe(false);
  });

  it("derives the visible liquidity target from exact action and rez quotes", () => {
    const input = decisionInput({
      credits: 2,
      extraLegalActions: [
        {
          actionId: "install-ice",
          costs: [{ clicks: 1, credits: 2 }],
          payload: {
            postInstallRezQuoteComplete: true,
            postInstallRezQuoteFinalCredits: 4,
          },
        },
      ],
    });

    expect(corpVisibleLiquidityDemandTarget(input)).toBe(7);
  });

  it("emits the unchanged P6 liquidity-development contract", () => {
    const input = decisionInput({
      credits: 2,
      clicks: 3,
      extraLegalActions: [
        {
          actionId: "install-ice",
          costs: [{ clicks: 1, credits: 2 }],
          payload: {
            postInstallRezQuoteComplete: true,
            postInstallRezQuoteFinalCredits: 4,
          },
        },
      ],
    });

    expect(
      corpTurnLiquidityDevelopmentNeed(
        input,
        [basicCreditCandidate()],
        undefined,
        "corp:23",
      ),
    ).toEqual({
      kind: "develop_liquidity",
      needId: "economy-visible-liquidity-development:corp:23",
      turnKey: "corp:23",
      targetCredits: 7,
      currentCreditsAtRevalidation: 2,
      gap: 5,
      projectedCreditGain: 1,
      actionIds: ["basic-credit"],
      priorityClass: "P6",
      cadence: {
        kind: "remaining_turn_capacity",
        maximumConversions: 3,
      },
      completion: {
        kind: "target_credits_or_no_clicks",
      },
      revalidation: {
        stateVersion: 12,
        status: "turn_liquidity_open",
      },
      urgentForScore: false,
      evidenceCode: "corp_engine_certified_basic_liquidity_development",
    });
  });

  it("preserves a valid resident target and conversion cadence", () => {
    const input = decisionInput({ credits: 2, clicks: 3 });
    const previous = {
      instances: [
        {
          moduleId: "corp.economy",
          dedupeKey: "economy-visible-liquidity-development:corp:23",
          moduleState: {
            kind: "economy",
            signal: {
              kind: "develop_liquidity",
              needId: "economy-visible-liquidity-development:corp:23",
              turnKey: "corp:23",
              targetCredits: 9,
              priorityClass: "P6",
              projectedCreditGain: 1,
              cadence: {
                kind: "remaining_turn_capacity",
                maximumConversions: 2,
              },
              revalidation: {
                stateVersion: 11,
              },
            },
          },
        },
      ],
    } as unknown as ResidentPlanPortfolio;

    const signal = corpTurnLiquidityDevelopmentNeed(
      input,
      [basicCreditCandidate()],
      previous,
      "corp:23",
    );

    expect(signal?.targetCredits).toBe(9);
    expect(signal?.cadence.maximumConversions).toBe(2);
  });

  it("binds every remaining normal click when no stronger liquidity demand exists", () => {
    const input = decisionInput({ credits: 5, clicks: 3 });

    expect(
      corpTurnLiquidityDevelopmentNeed(
        input,
        [basicCreditCandidate()],
        undefined,
        "corp:23",
      ),
    ).toMatchObject({
      targetCredits: 8,
      currentCreditsAtRevalidation: 5,
      gap: 3,
      cadence: {
        kind: "remaining_turn_capacity",
        maximumConversions: 3,
      },
    });
  });

  it("may develop liquidity before mandatory HQ cleanup", () => {
    const input = decisionInput({
      credits: 2,
      clicks: 2,
      handSize: 6,
      maximumHandSize: 5,
      extraLegalActions: [
        {
          actionId: "expensive-route",
          costs: [{ clicks: 1, credits: 8 }],
        },
      ],
    });

    expect(
      corpTurnLiquidityDevelopmentNeed(
        input,
        [basicCreditCandidate()],
        undefined,
        "corp:23",
      ),
    ).toMatchObject({
      targetCredits: 9,
      currentCreditsAtRevalidation: 2,
      gap: 7,
      actionIds: ["basic-credit"],
    });
  });

  it("extends a completed resident target only across the finite remaining clicks", () => {
    const input = decisionInput({ credits: 8, clicks: 2 });
    const previous = {
      instances: [
        {
          moduleId: "corp.economy",
          dedupeKey: "economy-visible-liquidity-development:corp:23",
          moduleState: {
            kind: "economy",
            signal: {
              kind: "develop_liquidity",
              needId: "economy-visible-liquidity-development:corp:23",
              turnKey: "corp:23",
              targetCredits: 8,
              priorityClass: "P6",
              projectedCreditGain: 1,
              cadence: {
                kind: "remaining_turn_capacity",
                maximumConversions: 1,
              },
              revalidation: {
                stateVersion: 11,
              },
            },
          },
        },
      ],
    } as unknown as ResidentPlanPortfolio;

    expect(
      corpTurnLiquidityDevelopmentNeed(
        input,
        [basicCreditCandidate()],
        previous,
        "corp:23",
      ),
    ).toMatchObject({
      targetCredits: 10,
      currentCreditsAtRevalidation: 8,
      gap: 2,
    });
  });

  it("does not reopen liquidity after the resident completion evidence", () => {
    const input = decisionInput({ credits: 0, clicks: 1 });
    const previous = {
      stateVersion: 12,
      turnPlanCommitment: {
        turnKey: "corp:turn:23",
      },
      instances: [
        {
          moduleId: "corp.complete_turn",
          createdAtStateVersion: 12,
          evidenceRefs: [
            {
              code: "corp_basic_credit_rejected_visible_liquidity_demand_satisfied",
            },
          ],
        },
      ],
    } as unknown as ResidentPlanPortfolio;

    expect(
      corpTurnLiquidityDevelopmentNeed(
        input,
        [basicCreditCandidate()],
        previous,
        "corp:23",
      ),
    ).toBeUndefined();
  });
});

function decisionInput(params?: {
  credits?: number;
  clicks?: number;
  handSize?: number;
  maximumHandSize?: number;
  extraLegalActions?: unknown[];
}): AiDecisionInput {
  return {
    side: "corp",
    actionNumber: 23,
    legalActions: [
      {
        actionId: "basic-credit",
        side: "corp",
        type: "gain_credit",
        source: "basic_action",
        expiresAtStateVersion: 12,
        targetRequirements: [],
        choiceRequirements: [],
        costs: [{ clicks: 1 }],
      },
      ...(params?.extraLegalActions ?? []),
    ],
    playerView: {
      stateVersion: 12,
      turnSerial: 23,
      own: {
        credits: params?.credits ?? 0,
        clicks: params?.clicks ?? 1,
        gripOrHq: Array.from({ length: params?.handSize ?? 0 }, (_, index) => ({
          instanceId: `corp-card-${index}`,
        })),
        maxHandSize: params?.maximumHandSize ?? 5,
      },
      servers: [],
    },
  } as unknown as AiDecisionInput;
}

function basicCreditCandidate(): ActionSemanticCandidate {
  return {
    actionId: "basic-credit",
    sourceKind: "basic_action",
    actionType: "gain_credit",
    semanticActionType: "economy.gain_credit",
    costProfile: {
      clickCost: 1,
      creditCost: 0,
      additionalCosts: [],
    },
    economyProjection: {
      kind: "immediate_liquid",
      timing: "immediate",
      creditRestriction: "general",
      clickCost: 1,
      creditCost: 0,
      grossLiquidCreditGain: 1,
      netLiquidCreditGain: 1,
      cardsDrawn: 0,
      cardsConsumed: 0,
      netHandDelta: 0,
      payoutMode: "fixed",
      reliability: "guaranteed",
      source: "basic_action_contract",
      confidence: "medium",
    },
  } as unknown as ActionSemanticCandidate;
}
