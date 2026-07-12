import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { assessPlanFollowupActionBudget } from "./tactical-plan-followup-budget";

describe("assessPlanFollowupActionBudget", () => {
  it.each([
    [1, true, "same_turn_required", "convert_now"],
    [2, true, "same_turn_required", "acquire_then_convert"],
    [1, false, "next_turn_allowed", "acquire_for_next_turn"],
    [1, false, "same_turn_required", "defer_acquisition"],
  ] as const)(
    "maps %s actions, conversion=%s and horizon=%s to %s",
    (clicks, conversionAvailable, horizon, recommendation) => {
      expect(
        assessPlanFollowupActionBudget({
          input: input(clicks),
          acquisitionActionIds: ["draw"],
          conversionActionIds: conversionAvailable ? ["install"] : [],
          requiredFollowupActions: 1,
          horizon,
        }),
      ).toMatchObject({ recommendation, availableActions: clicks });
    },
  );
});

function input(clicks: number): AiDecisionInput {
  const action = (actionId: string, type: LegalAction["type"]): LegalAction => ({
    actionId,
    side: "runner",
    type,
    label: actionId,
    source: "game_rule",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  });
  const legalActions = [action("draw", "draw_card"), action("install", "install_card")];
  return {
    side: "runner",
    legalActions,
    playerView: { own: { clicks }, legalActions },
  } as unknown as AiDecisionInput;
}
