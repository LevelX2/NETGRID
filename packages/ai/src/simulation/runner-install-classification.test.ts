import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { runnerDrawKindForSimulationAction } from "./runner-install-classification";

describe("runnerDrawKindForSimulationAction", () => {
  it("matches search roles by bounded role terms", () => {
    expect(drawKindForRoles(["program_search"])).toMatchObject({
      draw: true,
      cardEffect: true,
    });
    expect(drawKindForRoles(["research_noise"])).toMatchObject({
      draw: false,
      cardEffect: false,
    });
  });
});

function drawKindForRoles(roles: string[]) {
  return runnerDrawKindForSimulationAction(
    {
      playerView: {},
    } as AiDecisionInput,
    action(),
    {
      rolesForAction: () => roles,
      isSearchChoice: () => false,
    },
  );
}

function action(): LegalAction {
  return {
    actionId: "action",
    side: "runner",
    type: "trigger_ability",
    label: "Use action",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}
