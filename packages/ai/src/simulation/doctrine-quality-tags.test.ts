import { describe, expect, it } from "vitest";
import type { AiDecision, AiDecisionInput, LegalAction } from "@netgrid/shared";
import { qualityTagsForActionWithDependencies } from "./doctrine-quality-tags";

describe("qualityTagsForActionWithDependencies", () => {
  it("matches economy action roles by bounded role terms", () => {
    expect(tagsForRoles(["economy_operation"])).not.toContain("economy_stall");
    expect(tagsForRoles(["microeconomy_noise"])).toContain("economy_stall");
  });
});

function tagsForRoles(roles: string[]): string[] {
  return qualityTagsForActionWithDependencies(input(), action(), decision(), {
    extractFeatures: () => ({
      serverFeaturesById: new Map(),
      rigRoles: new Set(),
    }),
    findVisibleCard: () => undefined,
    rolesForAction: () => roles,
  });
}

function input(): AiDecisionInput {
  return {
    side: "runner",
    legalActions: [],
    playerView: {
      side: "runner",
      own: {
        credits: 0,
        gripOrHq: [],
        rig: [],
      },
      opponent: {
        agendaPoints: 0,
      },
      servers: [],
      agendaPointsToWin: 7,
    },
  } as unknown as AiDecisionInput;
}

function action(): LegalAction {
  return {
    actionId: "action",
    side: "runner",
    type: "play_event",
    label: "Use action",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}

function decision(): AiDecision {
  return {
    reasonCode: "test",
    fallbackUsed: false,
    timeoutUsed: false,
  } as AiDecision;
}
