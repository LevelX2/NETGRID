import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  corpOptionalDrawCapacity,
  corpOptionalDrawScoreComponents,
  corpQuantitativeDrawScoreComponents,
} from "./corp-defensive-draw";
import {
  corpAction,
  corpCard,
  corpInputWithHqCardsAndServers,
} from "../semantic-runtime-corp-score.test-support";

const draw = corpAction("corp.draw_card", "draw_card", {}, "basic_action");

describe("Corp defensive draw context", () => {
  it("uses the current maximum hand size for one-card draw capacity", () => {
    const input = drawInput(5, 4);

    const capacity = corpOptionalDrawCapacity(input, draw);
    const components = corpOptionalDrawScoreComponents(input, draw);

    expect(capacity).toMatchObject({
      eligible: true,
      handCount: 4,
      maxHandSize: 5,
      projectedDrawCount: 1,
      freeSlotsAfter: 0,
    });
    expect(components.map((component) => component.key)).toContain(
      "corp_safe_draw_capacity",
    );
    expect(components.map((component) => component.key)).not.toContain(
      "corp_low_hand",
    );
  });

  it("keeps the stronger low-hand signal when a slot remains after drawing", () => {
    const components = corpOptionalDrawScoreComponents(drawInput(5, 3), draw);

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "corp_safe_draw_capacity", value: 100 }),
        expect.objectContaining({ key: "corp_low_hand", value: 450 }),
      ]),
    );
  });

  it("does not reward optional draw at a full hand or max hand two", () => {
    expect(corpOptionalDrawScoreComponents(drawInput(5, 5), draw)).toEqual([]);
    expect(corpOptionalDrawScoreComponents(drawInput(2, 1), draw)).toEqual([]);
  });

  it("requires room for the complete projected draw amount", () => {
    const drawTwo = corpAction(
      "corp.draw_two",
      "draw_card",
      { drawCardsAmount: 2 },
      "card",
    );

    expect(corpOptionalDrawScoreComponents(drawInput(5, 4), drawTwo)).toEqual(
      [],
    );
    expect(
      corpOptionalDrawScoreComponents(drawInput(5, 3), drawTwo).map(
        (component) => component.key,
      ),
    ).toContain("corp_safe_draw_capacity");
  });

  it("consumes explicit multi-card draw yield from a played operation", () => {
    const annualReviews = corpAction(
      "corp.play.annual-reviews",
      "play_operation",
      { drawCardsAmount: 3 },
      "annual-reviews",
    );

    const components = corpOptionalDrawScoreComponents(
      drawInput(5, 2),
      annualReviews,
    );

    expect(
      corpOptionalDrawCapacity(drawInput(5, 2), annualReviews),
    ).toMatchObject({ eligible: true, projectedDrawCount: 3 });
    expect(components.map((component) => component.key)).toContain(
      "corp_safe_draw_capacity",
    );
    expect(
      corpQuantitativeDrawScoreComponents(drawInput(5, 2), annualReviews),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_quantitative_draw_yield",
          value: 1000,
        }),
      ]),
    );
  });

  it("does not reward optional draw while an existing protected score remote is urgent", () => {
    const components = corpOptionalDrawScoreComponents(drawInput(5, 4), draw, {
      primary: "protect_score_remote",
      severity: "high",
      targetServerId: "remote_1",
      scoreRemoteServerId: "remote_1",
      evidence: ["test_existing_protected_score_remote"],
    });

    expect(components).toEqual([]);
  });

  it("keeps draw eligible for speculative new-remote protection triage", () => {
    const components = corpOptionalDrawScoreComponents(drawInput(5, 4), draw, {
      primary: "protect_score_remote",
      severity: "high",
      targetServerId: "new_remote",
      scoreRemoteServerId: "new_remote",
      evidence: ["test_speculative_new_remote"],
    });

    expect(components.map((component) => component.key)).toContain(
      "corp_safe_draw_capacity",
    );
  });

  it("does not invent a defense draw need when both centrals have ICE", () => {
    const input = drawInput(5, 4, [centralIce("hq-ice"), centralIce("rd-ice")]);

    const components = corpOptionalDrawScoreComponents(input, draw);

    expect(components.map((component) => component.key)).not.toContain(
      "corp_missing_concrete_defense_draw",
    );
  });
});

function drawInput(
  maxHandSize: number,
  handCount: number,
  centralIce: VisibleCard[] = [],
): AiDecisionInput {
  const hq = Array.from({ length: handCount }, (_, index) =>
    corpCard(`hq-${index}`, "operation"),
  );
  const input = corpInputWithHqCardsAndServers(
    5,
    hq,
    [
      {
        id: "hq",
        label: "HQ",
        ice: centralIce.filter((card) => card.instanceId.startsWith("hq")),
        root: [],
      },
      {
        id: "rd",
        label: "R&D",
        ice: centralIce.filter((card) => card.instanceId.startsWith("rd")),
        root: [],
      },
    ],
    [draw],
  );
  input.playerView.own.maxHandSize = maxHandSize;
  input.playerView.own.stackOrRdCount = 20;
  return input;
}

function centralIce(instanceId: string): VisibleCard {
  return corpCard(instanceId, "ice", {
    definitionId: "onr_v1_263_reinforced-wall",
    title: "Reinforced Wall",
    subtypes: ["Wall"],
  });
}
