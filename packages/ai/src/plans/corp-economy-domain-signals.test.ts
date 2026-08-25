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

    expect(corpVisibleLiquidityDemandTarget(input)).toBe(6);
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
      needId: "economy-visible-liquidity-development:6",
      turnKey: "corp:23",
      targetCredits: 6,
      currentCreditsAtRevalidation: 2,
      gap: 4,
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

  it("preserves the resident target while revalidating cadence for the current turn", () => {
    const input = decisionInput({
      credits: 2,
      clicks: 3,
      extraLegalActions: [
        {
          actionId: "stable-demand",
          costs: [{ clicks: 1 }],
          payload: {
            postInstallRezQuoteComplete: true,
            postInstallRezQuoteFinalCredits: 9,
          },
        },
      ],
    });
    const previous = {
      instances: [
        {
          moduleId: "corp.economy",
          dedupeKey: "economy-visible-liquidity-development:9",
          moduleState: {
            kind: "economy",
            signal: {
              kind: "develop_liquidity",
              needId: "economy-visible-liquidity-development:9",
              turnKey: "corp:22",
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
    expect(signal?.cadence.maximumConversions).toBe(3);
  });

  it("does not create a strategic liquidity campaign solely from remaining clicks", () => {
    const input = decisionInput({ credits: 5, clicks: 3 });

    expect(
      corpTurnLiquidityDevelopmentNeed(
        input,
        [basicCreditCandidate()],
        undefined,
        "corp:23",
      ),
    ).toBeUndefined();
  });

  it("bounds explicitly non-strategic residual Basic Credits to the remaining turn capacity", () => {
    const input = decisionInput({ credits: 5, clicks: 3 });
    const signal = corpTurnLiquidityDevelopmentNeed(
      input,
      [basicCreditCandidate()],
      undefined,
      "corp:23",
      { admitResidualCapacity: true },
    );

    expect(signal).toMatchObject({
      needId: "economy-residual-capacity:corp:23",
      targetCredits: 8,
      gap: 3,
      residualCapacityOnly: true,
      cadence: { maximumConversions: 3 },
      evidenceCode: "corp_non_strategic_residual_capacity_use",
    });
    const previous = {
      instances: [
        {
          moduleId: "corp.economy",
          dedupeKey: signal!.needId,
          moduleState: { kind: "economy", signal },
        },
      ],
    } as unknown as ResidentPlanPortfolio;
    const reached = decisionInput({ credits: 8, clicks: 1 });
    expect(
      corpTurnLiquidityDevelopmentNeed(
        reached,
        [basicCreditCandidate()],
        previous,
        "corp:23",
        { admitResidualCapacity: true },
      ),
    ).toMatchObject({
      needId: signal!.needId,
      targetCredits: 8,
      gap: 0,
      residualCapacityOnly: true,
      completion: { kind: "remaining_turn_capacity_only" },
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
      targetCredits: 8,
      currentCreditsAtRevalidation: 2,
      gap: 6,
      actionIds: ["basic-credit"],
    });
  });

  it("does not reopen a completed resident target from remaining clicks", () => {
    const input = decisionInput({ credits: 8, clicks: 2 });
    const previous = {
      instances: [
        {
          moduleId: "corp.economy",
          dedupeKey: "economy-visible-liquidity-development:8",
          moduleState: {
            kind: "economy",
            signal: {
              kind: "develop_liquidity",
              needId: "economy-visible-liquidity-development:8",
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
    ).toBeUndefined();
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
