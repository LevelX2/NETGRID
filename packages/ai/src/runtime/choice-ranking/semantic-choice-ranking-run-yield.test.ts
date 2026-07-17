import { describe, expect, it } from "vitest";
import { tacticalPlanMappedChoice } from "../semantic-choice-ranking";
import {
  aiInput,
  centralRunMapping,
  choice,
  legalAction,
} from "./semantic-choice-ranking.test-support";

describe("tactical plan run yield contracts", () => {
  it("lets a useful non-run action beat an expensive central run with no reserve", () => {
    const draw = legalAction("draw", "draw_card");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [
        choice(run, 13, [], {
          key: "runner_visible_ice_path_cost",
          value: -1800,
          reason: "server:rd;break_cost:8;credits_after:1",
        }),
        choice(draw, 148),
      ],
      centralRunMapping([run]),
      choice(draw, 148),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("draw");
    expect(result.overrideReason).toBe("inferior_run_target_mapping_yield");
  });
});
