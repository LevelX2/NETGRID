import { describe, expect, it } from "vitest";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { runnerCentralRunPressureJustificationReasons } from "./central-run-pressure-justification";

describe("runnerCentralRunPressureJustificationReasons", () => {
  it("matches multiaccess roles by bounded role terms", () => {
    expect(reasonsForRoles(["interface_multiaccess"])).toContain(
      "multiaccess",
    );
    expect(reasonsForRoles(["multiaccessory_noise"])).not.toContain(
      "multiaccess",
    );
  });
});

function reasonsForRoles(roles: string[]): string[] {
  return runnerCentralRunPressureJustificationReasons(
    input(),
    "rd",
    false,
    {
      assessKnownRezzedIcePath: () =>
        ({ blocked: false, visibleBreakCost: 0, creditsAfterPath: 5 }) as never,
      recentCentralRunSameTargetWithoutRefresh: () => false,
      rolesForCardId: () => roles,
      runnerCreditReserveTargetForInput: () => 0,
      trueCentralCloseoutProfileForMetrics: () => ({ opportunity: false }),
    },
  );
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
