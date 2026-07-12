import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { runnerDrawTaxLiabilityScoreComponent } from "./runner-draw-tax-liability-score";

describe("runnerDrawTaxLiabilityScoreComponent", () => {
  it("prices a projected draw-tax tag as a material follow-up liability", () => {
    expect(
      runnerDrawTaxLiabilityScoreComponent(
        input(0),
        action({
          drawTaxDecision: "take_tags",
          drawTaxProjectedCreditsPaid: 0,
          drawTaxProjectedTagsAdded: 1,
        }),
      ),
    ).toMatchObject({
      key: "runner_draw_tax_tag_liability",
      value: -900,
      reason: "projected_tags:1;projected_credits_paid:0;current_tags:0",
    });
  });

  it("does not double-charge the credit-paying alternative", () => {
    expect(
      runnerDrawTaxLiabilityScoreComponent(
        input(0),
        action({
          drawTaxDecision: "pay_credits",
          drawTaxProjectedCreditsPaid: 1,
          drawTaxProjectedTagsAdded: 0,
        }),
      ),
    ).toBeUndefined();
  });
});

function input(tags: number): AiDecisionInput {
  return {
    side: "runner",
    playerView: { own: { tags } },
  } as AiDecisionInput;
}

function action(payload: Record<string, string | number | boolean>): LegalAction {
  return {
    actionId: "runner.draw-tax",
    side: "runner",
    type: "draw_card",
    label: "Karte ziehen",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    payload,
  };
}
