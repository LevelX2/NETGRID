import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { runnerLoanProjectedSpendAfterLoan } from "./runner-loan-projected-spend";

describe("runnerLoanProjectedSpendAfterLoan", () => {
  it("never projects more follow-up spend than the loan leaves available", () => {
    const input = {
      playerView: {
        own: {
          clicks: 3,
          gripOrHq: [card("first", 4), card("second", 4)],
        },
      },
    } as unknown as AiDecisionInput;
    const loanAction = { source: "loan", payload: {} } as LegalAction;

    const projected = runnerLoanProjectedSpendAfterLoan(
      input,
      loanAction,
      6,
      {
        actionClickCost: () => 1,
        actionCreditCost: () => 0,
        projectedCreditGainForAction: () => 0,
        definitionIsHighRiskLoan: () => false,
        visibleCardPlayOrInstallCost: (candidate) =>
          candidate.definitionId ? 4 : 0,
        rolesForCardId: () => [],
        spendCandidateKind: () => "generic_setup",
        spendKindRank: () => 1,
      },
    );

    expect(projected.plannedSpendAfterLoan).toBe(4);
    expect(projected.genericSetupSpendCount).toBe(1);
  });
});

function card(instanceId: string, cost: number): VisibleCard {
  return {
    instanceId,
    definitionId: instanceId,
    known: true,
    title: `cost-${cost}`,
  } as unknown as VisibleCard;
}
