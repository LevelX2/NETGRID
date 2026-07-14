import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { DeckCapabilityProfile } from "../deck-capabilities";
import {
  runnerCreditBankAssessment,
} from "./tactical-plan-bank-tools";
import type { TacticalPlanBuildContext } from "./tactical-plan-types";

describe("runnerCreditBankAssessment", () => {
  it("does not open a bank-build plan with a comfortable liquid pool", () => {
    const assessment = runnerCreditBankAssessment(
      context({ credits: 10, storedCredits: 0 }),
      [BUILD_ACTION],
      false,
    );

    expect(assessment.shouldBuild).toBe(false);
    expect(assessment.evidence).toContain("runner_bank_build_ready:false");
  });

  it("does not keep building after liquid and stored credits reach value", () => {
    expect(
      runnerCreditBankAssessment(
        context({ credits: 9, storedCredits: 3 }),
        [BUILD_ACTION],
        false,
      ).shouldBuild,
    ).toBe(false);
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

  it("stops building when liquid plus stored access exceeds the combined target", () => {
    const assessment = runnerCreditBankAssessment(
      context({ credits: 12, storedCredits: 9, cashOutLegal: true }),
      [BUILD_ACTION, CASH_OUT_ACTION],
      false,
    );

    expect(assessment.shouldBuild).toBe(false);
    expect(assessment.evidence).toEqual(
      expect.arrayContaining([
        "runner_bank_combined_credit_access:21",
        "runner_bank_combined_access_target:18",
        "runner_bank_build_ready:false",
      ]),
    );
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
