import { describe, expect, it } from "vitest";
import {
  bestSemanticRuntimeChoiceForTacticalPlanOverride,
  tacticalPlanMappedChoice,
} from "../semantic-choice-ranking";
import {
  aiInput,
  choice,
  coverageMapping,
  creditBaseMapping,
  legalAction,
} from "./semantic-choice-ranking.test-support";

describe("tacticalPlanMappedChoice mapping contracts", () => {
  it("keeps the general override candidate score-based before a mapped run is known", () => {
    const draw = legalAction("draw", "draw_card");
    const gain = legalAction("gain", "gain_credit");
    const drawChoice = choice(draw, 1543, [], {
      key: "runner_hand_buffer_need",
      value: 600,
      reason: "hand:1|damage_pressure:false",
    });

    const override = bestSemanticRuntimeChoiceForTacticalPlanOverride(
      [choice(gain, 1679), drawChoice],
      { planAlternatives: [] } as never,
    );

    expect(override?.action.actionId).toBe("gain");
  });
  it("keeps runner plan mapping over a clear off-plan semantic run gap", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 7645), choice(gain, 7025)],
      coverageMapping([gain]),
      choice(run, 7645),
    );

    expect(result.overrideChoice).toBeUndefined();
    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideBlockedChoice?.action.actionId).toBe("run-rd");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
    expect(result.scoreGap).toBe(620);
    expect(result.choice?.evidence).toEqual(
      expect.arrayContaining([
        "tactical_plan_mapping_outcome:semantic_choice_blocked",
        "tactical_plan_mapping_override_blocked:true",
        "tactical_plan_override_blocked_reason:runner_plan_controller",
      ]),
    );
  });

  it("ranks only plan-compatible mapped actions inside the selected plan", () => {
    const basicCredit = legalAction("basic-credit", "gain_credit");
    const economyEvent = legalAction("economy-event", "play_event");
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(economyEvent, 1440), choice(basicCredit, 90)],
      creditBaseMapping([basicCredit, economyEvent]),
      choice(economyEvent, 1440),
    );

    expect(result.outcome).toBe("plan_mapping_selected");
    expect(result.choice?.action.actionId).toBe("economy-event");
    expect(result.choice?.evidence).toEqual(
      expect.arrayContaining([
        "tactical_plan_mapping_outcome:plan_mapping_selected",
      ]),
    );
  });

  it("uses plan-step priority before generic score for mapped credit actions", () => {
    const basicCredit = legalAction("basic-credit", "gain_credit");
    const economyEvent = legalAction("economy-event", "play_event");
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(basicCredit, 1679), choice(economyEvent, 87)],
      creditBaseMapping([economyEvent, basicCredit], {
        actionPriorities: [
          { actionId: "economy-event", priority: 300 },
          { actionId: "basic-credit", priority: 100 },
        ],
      }),
      choice(basicCredit, 1679),
    );

    expect(result.outcome).toBe("plan_mapping_selected");
    expect(result.choice?.action.actionId).toBe("economy-event");
    expect(result.choice?.evidence).toEqual(
      expect.arrayContaining([
        "tactical_plan_mapping_outcome:plan_mapping_selected",
        "tactical_plan_step_priority_selected:true",
        "tactical_plan_step_priority:300",
      ]),
    );
  });
});
