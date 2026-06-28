import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  runnerCoverageRepairDiagnostic,
  runnerKnownPathDiagnosticsForAction,
} from "./runner-known-no-access";

describe("runnerCoverageRepairDiagnostic", () => {
  it("matches coverage repair roles by bounded role terms", () => {
    expect(diagnosticForRoles(["program_search"])).toMatchObject({
      runnerCoverageRepairIntentSearchTaken: true,
      runnerCoverageRepairIntentSatisfied: true,
    });
    expect(diagnosticForRoles(["trash_recovery"])).toMatchObject({
      runnerCoverageRepairIntentRecoveryTaken: true,
      runnerCoverageRepairIntentSatisfied: true,
    });
    expect(diagnosticForRoles(["research_noise", "recoveryish_noise"]))
      .toMatchObject({
        runnerCoverageRepairIntentNoFollowup: true,
      });
  });
});

describe("runnerKnownPathDiagnosticsForAction", () => {
  it("matches positive probe roles by bounded role terms", () => {
    expect(pathDiagnosticForRoles(["run_probe"])).toMatchObject({
      probeRunWithPositiveInfoValue: true,
      runnerRunCouldOnlyForceRezButNotAccess: true,
    });
    expect(pathDiagnosticForRoles(["probescape_noise"])).not.toHaveProperty(
      "probeRunWithPositiveInfoValue",
    );
  });
});

function diagnosticForRoles(roles: string[]) {
  return runnerCoverageRepairDiagnostic(input(), action(), {
    runnerKnownNoAccessLegalRunTargets: () => [
      {
        serverId: "remote_1",
        assessment: {} as never,
      },
    ],
    sourceDefinitionIdForAction: () => "source",
    rolesForCardId: () => roles,
  });
}

function input(): AiDecisionInput {
  return { side: "runner" } as AiDecisionInput;
}

function action(): LegalAction {
  return baseAction("trigger_ability");
}

function startRun(): LegalAction {
  return {
    ...baseAction("start_run"),
    actionId: "run_remote_1",
    payload: { serverId: "remote_1" },
  };
}

function baseAction(type: LegalAction["type"]): LegalAction {
  return {
    actionId: "action",
    side: "runner",
    type,
    label: "Use action",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}

function pathDiagnosticForRoles(roles: string[]) {
  return runnerKnownPathDiagnosticsForAction(
    pathInput(),
    startRun(),
    "remote_1",
    0,
    {
      assessKnownRezzedIcePath: () =>
        ({
          assessedKnownIceCount: 1,
          blocked: true,
          canReachAccess: false,
          visibleBreakCost: 5,
        }) as never,
      remoteServerHasScoreThreat: () => false,
      rolesForAction: () => roles,
      rolesForCardId: () => [],
      runnerCoverageRepairDiagnostic: () => ({}),
      runnerHasRecentRunOnServer: () => false,
      runnerKnownPathAssessmentIsKnownNoAccess: () => true,
      runnerKnownPathAssessmentIsUnbreakableNoAccess: () => false,
      runnerRemoteHasKnownRelevantTrashTarget: () => false,
      runnerRunTargetHasOnlyUnknownOrUnrezzedIce: () => false,
    },
  );
}

function pathInput(): AiDecisionInput {
  return {
    side: "runner",
    legalActions: [startRun()],
    playerView: {
      own: {
        credits: 0,
        rig: [],
      },
      servers: [
        {
          id: "remote_1",
          ice: [],
          root: [],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}
