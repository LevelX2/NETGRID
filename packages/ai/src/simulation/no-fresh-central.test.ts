import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import {
  noFreshCentralSubstitutionTypeForAction,
  trueCentralCloseoutProfile,
} from "./no-fresh-central";

describe("no-fresh central diagnostics", () => {
  it("matches central closeout multiaccess roles by bounded role terms", () => {
    expect(closeoutForRoles(["interface_multiaccess"])).toMatchObject({
      opportunity: true,
      reasons: expect.arrayContaining(["multiaccess"]),
    });
    expect(closeoutForRoles(["multiaccessory_noise"])).toMatchObject({
      opportunity: false,
    });
  });

  it("matches setup search substitutions by bounded role terms", () => {
    expect(substitutionForRoles(["program_search"])).toBe("setup_search");
    expect(substitutionForRoles(["research_noise"])).toBeUndefined();
  });
});

function closeoutForRoles(roles: string[]) {
  return trueCentralCloseoutProfile(input(), "rd", {
    assessKnownRezzedIcePath: () =>
      ({ blocked: false, visibleBreakCost: 0 }) as never,
    rolesForCardId: () => roles,
    sourceDefinitionIdForAction: () => undefined,
  });
}

function substitutionForRoles(roles: string[]) {
  return noFreshCentralSubstitutionTypeForAction(input(), playEvent(), {
    isRunnerEconomyAction: () => false,
    rolesForAction: () => roles,
    sourceDefinitionIdForAction: () => undefined,
  });
}

function input(): AiDecisionInput {
  return {
    side: "runner",
    legalActions: [],
    playerView: {
      agendaPointsToWin: 7,
      own: {
        agendaPoints: 5,
        credits: 5,
        gripOrHq: [card("one"), card("two"), card("three")],
        rig: [card("rig_card")],
      },
      opponent: {
        handCount: 0,
      },
      servers: [
        {
          id: "rd",
          ice: [],
          root: [],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}

function playEvent(): LegalAction {
  return {
    actionId: "play",
    side: "runner",
    type: "play_event",
    label: "Play event",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}

function card(definitionId: string): VisibleCard {
  return {
    instanceId: definitionId,
    definitionId,
    known: true,
  } as VisibleCard;
}
