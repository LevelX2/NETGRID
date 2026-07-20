import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { DeckCapabilityProfile } from "../deck-capabilities";
import {
  runnerConvertibleBankRunFundingConsumer,
  runnerCreditBankAssessment,
} from "./tactical-plan-bank-tools";
import type { TacticalPlanBuildContext } from "./tactical-plan-types";

describe("runnerCreditBankAssessment", () => {
  it("does not open a bank-build plan with a comfortable liquid pool", () => {
    const assessment = runnerCreditBankAssessment(
      context({ credits: 15, storedCredits: 0 }),
      [BUILD_ACTION],
      false,
    );

    expect(assessment.shouldBuild).toBe(false);
    expect(assessment.evidence).toContain("runner_bank_build_ready:false");
  });

  it("keeps building while the liquid pool remains below fifteen", () => {
    expect(
      runnerCreditBankAssessment(
        context({ credits: 9, storedCredits: 3 }),
        [BUILD_ACTION],
        false,
      ).shouldBuild,
    ).toBe(true);
  });

  it("keeps the low-credit first-load route available", () => {
    expect(
      runnerCreditBankAssessment(
        context({ credits: 6, storedCredits: 0 }),
        [BUILD_ACTION],
        false,
      ).shouldBuild,
    ).toBe(true);
  });

  it("finishes a bank toward twelve despite high combined access", () => {
    const assessment = runnerCreditBankAssessment(
      context({ credits: 12, storedCredits: 9, cashOutLegal: true }),
      [BUILD_ACTION, CASH_OUT_ACTION],
      false,
    );

    expect(assessment.shouldBuild).toBe(true);
    expect(assessment.evidence).toEqual(
      expect.arrayContaining([
        "runner_bank_combined_credit_access:21",
        "runner_bank_build_ready:true",
      ]),
    );
  });

  it("uses the least-loaded source when planning a multi-bank portfolio", () => {
    const assessment = runnerCreditBankAssessment(
      context({
        credits: 8,
        storedCredits: 12,
        storedCreditAmounts: [12, 0],
      }),
      [BUILD_ACTION],
      false,
    );

    expect(assessment.currentStoredCredits).toBe(0);
    expect(assessment.shouldBuild).toBe(true);
  });

  it("names the valuable run route that a bank payout can fund", () => {
    const bankContext = context({
      credits: 4,
      storedCredits: 3,
      cashOutLegal: true,
    });
    bankContext.runnerRunTargetEvaluations = [
      {
        targetServerId: "remote_2",
        accessPayoff: "trash_affordable",
        knownAccessState: "known",
        pathPassability: "blocked_unpayable",
        pathCost: 7,
        creditsAfterRun: 0,
        scoreThreat: false,
        score: 420,
        routeQuote: {
          reachability: "conditional_access",
          knownCost: 4,
          guaranteedKnownCost: 7,
          availableCredits: 4,
          fundingGap: 3,
          unknownIceCount: 0,
          effects: [],
          conditionalReasons: [
            "visible_access_preventing_effect_not_guaranteed",
          ],
          evidence: [],
        },
      } as unknown as NonNullable<
        TacticalPlanBuildContext["runnerRunTargetEvaluations"]
      >[number],
    ];

    expect(runnerConvertibleBankRunFundingConsumer(bankContext)).toEqual({
      targetServerId: "remote_2",
      fundingGap: 3,
      accessPayoff: "trash_affordable",
      evidence: [
        "runner_bank_funding_consumer:run_route",
        "runner_bank_funding_consumer_server:remote_2",
        "runner_bank_funding_consumer_gap:3",
        "runner_bank_funding_consumer_payoff:trash_affordable",
      ],
    });
  });

  it("does not name banking as a solution for a route with no access", () => {
    const bankContext = context({
      credits: 4,
      storedCredits: 6,
      cashOutLegal: true,
    });
    bankContext.runnerRunTargetEvaluations = [
      {
        targetServerId: "remote_2",
        accessPayoff: "agenda",
        knownAccessState: "known",
        pathPassability: "blocked_unpayable",
        pathCost: 7,
        creditsAfterRun: 0,
        scoreThreat: true,
        score: 800,
        routeQuote: {
          reachability: "no_access",
          knownCost: 7,
          guaranteedKnownCost: 7,
          availableCredits: 4,
          fundingGap: 3,
          unknownIceCount: 0,
          effects: [],
          conditionalReasons: [],
          noAccessReason: "known_unbreakable_ice",
          evidence: [],
        },
      } as unknown as NonNullable<
        TacticalPlanBuildContext["runnerRunTargetEvaluations"]
      >[number],
    ];

    expect(
      runnerConvertibleBankRunFundingConsumer(bankContext),
    ).toBeUndefined();
  });
});

const BUILD_ACTION = {
  actionId: "build-bank",
  side: "runner",
  type: "activated_card_ability",
  source: "bank",
  label: "Build bank",
  payload: {},
} as LegalAction;

const CASH_OUT_ACTION = {
  actionId: "cash-out-bank",
  side: "runner",
  type: "trigger_ability",
  source: "bank",
  label: "Cash out bank",
  payload: {},
} as LegalAction;

function context(params: {
  credits: number;
  storedCredits: number;
  storedCreditAmounts?: number[];
  cashOutLegal?: boolean;
}): TacticalPlanBuildContext {
  return {
    input: {
      side: "runner",
      playerView: {
        own: { credits: params.credits },
      },
      legalActions: params.cashOutLegal
        ? [BUILD_ACTION, CASH_OUT_ACTION]
        : [BUILD_ACTION],
    } as AiDecisionInput,
    deckCapabilities: {
      runner: {
        economyBankTools: [
          {
            cardId: "bank",
            title: "Bank",
            ownerSide: "runner",
            status: "installed",
            currentBankAmount: params.storedCredits,
            ...(params.storedCreditAmounts
              ? { currentBankAmounts: params.storedCreditAmounts }
              : {}),
            buildActionLegal: true,
            cashOutActionLegal: params.cashOutLegal ?? false,
            buildActionIds: [BUILD_ACTION.actionId],
            cashOutActionIds: params.cashOutLegal
              ? [CASH_OUT_ACTION.actionId]
              : [],
            confidence: "high",
            evidence: [],
          },
        ],
      },
    } as unknown as DeckCapabilityProfile,
  };
}
