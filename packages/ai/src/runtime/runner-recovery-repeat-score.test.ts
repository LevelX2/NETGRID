import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  runnerLateNoFundingCreditRepeatScoreComponent,
  runnerLateNoFundingCreditSafeProgressTargets,
} from "./runner-recovery-repeat-score";

describe("Runner recovery repeat scoring", () => {
  it("penalizes repeated basic credits when fresh safe pressure exists", () => {
    const component = runnerLateNoFundingCreditRepeatScoreComponent(
      input(7),
      gainCreditAction(),
      {
        recentBasicCreditActions: () => 2,
        fundingNeedContext: () => ({ active: false, reason: "none" }),
        safeProgressTargets: () => [
          { serverId: "rd", targetType: "central_pressure" },
        ],
      },
    );

    expect(component?.key).toBe("runner_late_no_funding_credit_repeat");
    expect(component?.value).toBeLessThanOrEqual(-1400);
  });

  it("treats fresh pressure as progress even without a near-win closeout", () => {
    const targets = runnerLateNoFundingCreditSafeProgressTargets(input(6), {
      closeout: () => ({ opportunity: false }),
      pressureReadyTargets: () => [
        { serverId: "hq", targetType: "central_pressure" },
        { serverId: "rd", targetType: "central_pressure" },
      ],
      recentStartRunsOnServer: (_input, serverId) =>
        serverId === "hq" ? 1 : 0,
    });

    expect(targets).toEqual([
      { serverId: "rd", targetType: "central_pressure" },
    ]);
  });
});

function gainCreditAction(): LegalAction {
  return {
    actionId: "runner.gain_credit",
    side: "runner",
    type: "gain_credit",
    source: "basic_action",
  } as LegalAction;
}

function input(credits: number): AiDecisionInput {
  return {
    side: "runner",
    playerView: { own: { credits } },
  } as AiDecisionInput;
}
