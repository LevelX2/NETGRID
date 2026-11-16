import { describe, expect, it } from "vitest";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";
import {
  runnerCentralRunBurnsRemoteContestReserve,
  runnerCentralRunPressureJustificationReasons,
} from "./central-run-pressure-justification";

describe("runnerCentralRunPressureJustificationReasons", () => {
  it("matches multiaccess roles by bounded role terms", () => {
    expect(reasonsForRoles(["interface_multiaccess"])).toContain("multiaccess");
    expect(reasonsForRoles(["multiaccessory_noise"])).not.toContain(
      "multiaccess",
    );
  });
  it("uses the actual trace profile and Corp bid budget for the reserve", () => {
    const decision = input();
    decision.playerView.own.credits = 10;
    decision.playerView.own.rig = [];
    decision.playerView.opponent.credits = 4;
    decision.playerView.servers[0]!.ice = [
      {
        ...card("onr_v1_249_hunter"),
        type: "ice",
        subtypes: ["sentry", "bloodhound"],
        rezzed: true,
        strength: 5,
        effectiveRunQuote: {
          iceInstanceId: "onr_v1_249_hunter",
          iceDefinitionId: "onr_v1_249_hunter",
          effectiveStrength: 5,
          subroutines: [
            {
              id: "hunter_trace",
              type: "initiate_trace",
              sourceDefinitionId: "onr_v1_249_hunter",
              sourceTitle: "Hunter",
              amount: 5,
              traceLimit: 5,
              traceSuccessEffect: { type: "add_tag", amount: 1 },
              breakTags: ["trace"],
            },
          ],
        },
      },
    ];
    const burnsReserve = () =>
      runnerCentralRunBurnsRemoteContestReserve(
        decision,
        "rd",
        [{ postRunReserveTarget: 6 }],
        { assessKnownRezzedIcePath },
      );

    decision.playerView.traceRulesProfile = "modern_open";
    expect(burnsReserve()).toBe(true);
    decision.playerView.traceRulesProfile = "classic_blind";
    expect(burnsReserve()).toBe(false);
  });
});

function reasonsForRoles(roles: string[]): string[] {
  return runnerCentralRunPressureJustificationReasons(input(), "rd", false, {
    assessKnownRezzedIcePath: () =>
      ({ blocked: false, visibleBreakCost: 0, creditsAfterPath: 5 }) as never,
    recentCentralRunSameTargetWithoutRefresh: () => false,
    rolesForCardId: () => roles,
    runnerCreditReserveTargetForInput: () => 0,
    trueCentralCloseoutProfileForMetrics: () => ({ opportunity: false }),
  });
}

function input(): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      own: {
        credits: 5,
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

function card(definitionId: string): VisibleCard {
  return {
    instanceId: definitionId,
    definitionId,
    known: true,
  } as VisibleCard;
}
