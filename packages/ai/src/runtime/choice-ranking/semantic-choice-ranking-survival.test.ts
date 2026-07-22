import { describe, expect, it } from "vitest";
import { tacticalPlanMappedChoice } from "../semantic-choice-ranking";
import {
  aiInput,
  choice,
  legalAction,
  survivalMapping,
} from "./semantic-choice-ranking.test-support";

describe("tacticalPlanMappedChoice survival progress", () => {
  it("lets a positive action replace a nonprogressive survival credit", () => {
    const gain = legalAction("gain", "gain_credit");
    const develop = legalAction("develop", "install_card");
    const mappedCredit = choice(gain, -1121, [], {
      key: "runner_rich_credit_without_conversion",
      value: -1200,
      reason: "credits:14|conversion:false",
    });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(develop, 1362), mappedCredit],
      survivalMapping([gain], 0),
      choice(develop, 1362),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("develop");
    expect(result.overrideReason).toBe("mapped_nonpositive_against_positive");
    expect(result.overrideThreshold).not.toBe(Number.POSITIVE_INFINITY);
  });

  it("keeps a progress-capable survival draw over generic development", () => {
    const draw = legalAction("draw", "draw_card");
    const develop = legalAction("develop", "install_card");
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(develop, 1000), choice(draw, 200)],
      survivalMapping([draw], 260),
      choice(develop, 1000),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("draw");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
    expect(result.overrideThreshold).toBe(Number.POSITIVE_INFINITY);
  });
});
