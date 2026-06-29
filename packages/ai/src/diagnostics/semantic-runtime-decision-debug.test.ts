import { describe, expect, it } from "vitest";
import { semanticRuntimeDecisionDebugTopLevelWhyNot } from "./semantic-runtime-decision-debug";

describe("SemanticRuntimeDecisionDebug", () => {
  it("summarizes alternative why-not facts at top level", () => {
    expect(
      semanticRuntimeDecisionDebugTopLevelWhyNot([
        {
          rank: 1,
          actionId: "gain",
          actionType: "gain_credit",
          selected: true,
          priority: 90,
          whyChosen: ["semantic_runtime_actual"],
          whyNot: ["selected_action"],
        },
        {
          rank: 2,
          actionId: "draw",
          actionType: "draw_card",
          selected: false,
          priority: 45,
          whyNot: [
            "semantic_score_below_selected",
            "rawSemanticScore:45",
            "privatePayload should redact",
          ],
        },
      ]),
    ).toEqual([
      "alternative:draw_card:semantic_score_below_selected",
      "alternative:draw_card:rawSemanticScore:45",
    ]);
  });
});
