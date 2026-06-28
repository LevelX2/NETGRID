import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { runnerCoverageRepairDiagnostic } from "./runner-known-no-access";

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
