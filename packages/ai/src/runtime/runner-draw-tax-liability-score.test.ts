import { describe, expect, it } from "vitest";
import {
  RUNNER_DRAW_PROJECTION_SCHEMA_VERSION,
  type AiDecisionInput,
  type LegalAction,
} from "@netgrid/shared";
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

  it("projects a visible per-card draw tax when the initiating action has no tax payload", () => {
    const multiDraw = action({ drawCardsAmount: 5 });
    multiDraw.type = "play_event";
    multiDraw.source = "runner-multi-draw";
    multiDraw.costs = [{ clicks: 1, credits: 2 }];

    expect(
      runnerDrawTaxLiabilityScoreComponent(
        input(0, {
          credits: 2,
          visibleTagSourceDefinitionId: "onr_v1_313_city-surveillance",
        }),
        multiDraw,
      ),
    ).toMatchObject({
      key: "runner_draw_tax_tag_liability",
      value: -4500,
      reason: "projected_tags:5;projected_credits_paid:0;current_tags:0",
    });
  });

  it("does not treat a different visible tag source as a per-card draw tax", () => {
    const multiDraw = action({ drawCardsAmount: 5 });
    multiDraw.type = "play_event";
    multiDraw.source = "runner-multi-draw";
    multiDraw.costs = [{ clicks: 1, credits: 2 }];

    expect(
      runnerDrawTaxLiabilityScoreComponent(
        input(0, {
          credits: 2,
          visibleTagSourceDefinitionId: "onr_v1_333_omniscience-foundation",
        }),
        multiDraw,
      ),
    ).toBeUndefined();
  });

  it("keeps a five-card draw when every visible draw tax is affordable", () => {
    const multiDraw = action({ drawCardsAmount: 5 });
    multiDraw.type = "play_event";
    multiDraw.source = "runner-multi-draw";
    multiDraw.costs = [{ clicks: 1, credits: 2 }];

    expect(
      runnerDrawTaxLiabilityScoreComponent(
        input(0, {
          credits: 7,
          visibleTagSourceDefinitionId: "onr_v1_313_city-surveillance",
        }),
        multiDraw,
      ),
    ).toBeUndefined();
  });

  it("prices every projected Crash Everett draw without inflating net hand growth", () => {
    expect(
      runnerDrawTaxLiabilityScoreComponent(
        input(0, {
          credits: 0,
          visibleTagSourceDefinitionId: "onr_v1_313_city-surveillance",
        }),
        action({
          runnerDrawProjectionSchemaVersion:
            RUNNER_DRAW_PROJECTION_SCHEMA_VERSION,
          projectedGrossDrawCount: 2,
          projectedPostDrawDispositionCount: 1,
          projectedNetHandDelta: 1,
          visibleDrawTaxSourceCount: 1,
        }),
      ),
    ).toMatchObject({
      key: "runner_draw_tax_tag_liability",
      value: -1800,
      reason: "projected_tags:2;projected_credits_paid:0;current_tags:0",
    });
  });
});

function input(
  tags: number,
  options: {
    credits?: number;
    visibleTagSourceDefinitionId?: string;
  } = {},
): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      own: { tags, credits: options.credits ?? 0 },
      servers: options.visibleTagSourceDefinitionId
        ? [
            {
              id: "remote_1",
              ice: [],
              root: [
                {
                  instanceId: "visible-tag-source",
                  definitionId: options.visibleTagSourceDefinitionId,
                  known: true,
                  rezzed: true,
                },
              ],
            },
          ]
        : [],
    },
  } as unknown as AiDecisionInput;
}

function action(
  payload: Record<string, string | number | boolean>,
): LegalAction {
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
