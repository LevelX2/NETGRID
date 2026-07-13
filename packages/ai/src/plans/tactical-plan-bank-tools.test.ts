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
});

const BUILD_ACTION = {
  actionId: "build-bank",
  side: "runner",
  type: "activated_card_ability",
  source: "bank",
  label: "Build bank",
  payload: {},
} as LegalAction;

function context(params: {
  credits: number;
  storedCredits: number;
}): TacticalPlanBuildContext {
  return {
    input: {
      side: "runner",
      playerView: {
        own: { credits: params.credits },
      },
      legalActions: [BUILD_ACTION],
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
            cashOutActionLegal: false,
            buildActionIds: [BUILD_ACTION.actionId],
            cashOutActionIds: [],
            confidence: "high",
            evidence: [],
          },
        ],
      },
    } as unknown as DeckCapabilityProfile,
  };
}
