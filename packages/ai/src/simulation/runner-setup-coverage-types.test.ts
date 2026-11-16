import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  runnerCoverageRecoveryActionForMetrics,
  runnerHasKnownBlockedPathByCoverage,
  runnerCoverageSearchActionForMetrics,
  runnerMissingCoverageTypesForInput,
} from "./runner-setup-coverage-types";

describe("runner coverage action metrics", () => {
  it("matches search and recovery roles by bounded role terms", () => {
    expect(searchForRoles(["program_search"])).toBe(true);
    expect(searchForRoles(["research_noise"])).toBe(false);
    expect(recoveryForRoles(["trash_recovery"])).toBe(true);
    expect(recoveryForRoles(["recoveryish_noise"])).toBe(false);
  });

  it("counts a missing breaker and excludes a block caused only by credits", () => {
    const inputWithFort = {
      ...input(),
      playerView: {
        ...input().playerView,
        own: { credits: 1, rig: [] },
        servers: [{ id: "rd", ice: [], root: [] }],
      },
    } as unknown as AiDecisionInput;
    function hasCoverageBlock(knownPathBlockedByMissingCoverage: boolean) {
      return runnerHasKnownBlockedPathByCoverage(inputWithFort, {
        rolesForCardId: () => [],
        assessKnownRezzedIcePath: () =>
          ({
            blocked: true,
            knownPathBlockedByMissingCoverage,
          }) as never,
      });
    }
    expect(hasCoverageBlock(false)).toBe(false);
    expect(hasCoverageBlock(true)).toBe(true);
  });

  it("matches special subroutine coverage needs by bounded terms", () => {
    expect(missingCoverageForSubroutineType("trace")).toContain("special");
    expect(missingCoverageForSubroutineType("net_damage")).toContain("special");
    expect(missingCoverageForSubroutineType("traceish_noise")).not.toContain(
      "special",
    );
    expect(missingCoverageForSubroutineType("damageish_noise")).not.toContain(
      "special",
    );
  });
});

function searchForRoles(roles: string[]): boolean {
  return runnerCoverageSearchActionForMetrics(input(), action(), {
    rolesForAction: () => roles,
    findVisibleCard: () => undefined,
  });
}

function recoveryForRoles(roles: string[]): boolean {
  return runnerCoverageRecoveryActionForMetrics(input(), action(), {
    rolesForAction: () => roles,
    findVisibleCard: () => undefined,
  });
}

function missingCoverageForSubroutineType(type: string) {
  return runnerMissingCoverageTypesForInput(
    {
      side: "runner",
      playerView: {
        own: {
          rig: [],
        },
        servers: [
          {
            id: "rd",
            ice: [
              {
                known: true,
                definitionId: "synthetic_ice",
                effectiveRunQuote: {
                  subroutines: [{ type }],
                },
              },
            ],
            root: [],
          },
        ],
      },
    } as unknown as AiDecisionInput,
    {
      rolesForCardId: () => [],
      assessKnownRezzedIcePath: () => ({ blocked: false }) as never,
    },
  );
}

function input(): AiDecisionInput {
  return {
    side: "runner",
    playerView: {},
  } as AiDecisionInput;
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
