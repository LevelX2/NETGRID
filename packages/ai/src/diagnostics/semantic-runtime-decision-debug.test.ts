import { describe, expect, it } from "vitest";
import {
  semanticRuntimeDecisionDebugRunnerRunPlanItems,
  semanticRuntimeDecisionDebugTopLevelWhyNot,
} from "./semantic-runtime-decision-debug";

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
        {
          rank: 3,
          actionId: "draw-again",
          actionType: "draw_card",
          selected: false,
          priority: 44,
          whyNot: ["semantic_score_below_selected"],
        },
      ]),
    ).toEqual([
      "alternative:draw_card:semantic_score_below_selected",
      "alternative:draw_card:rawSemanticScore:45",
    ]);
  });

  it("extracts redacted Runner RunPlan diagnostics from selected evidence", () => {
    expect(
      semanticRuntimeDecisionDebugRunnerRunPlanItems([
        "runner_run_plan_id:runplan-1",
        "runner_run_plan_target:rd",
        "runner_run_plan_path_quote_total_known_cost:2",
        "runner_run_plan_sequence_selected:true",
        "privatePayload:bad",
        "unrelated:evidence",
      ]),
    ).toEqual([
      "runner_run_plan_id:runplan-1",
      "runner_run_plan_target:rd",
      "runner_run_plan_path_quote_total_known_cost:2",
      "runner_run_plan_sequence_selected:true",
    ]);
  });
});
