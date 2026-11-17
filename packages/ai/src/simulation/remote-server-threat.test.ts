import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { expect, it } from "vitest";

import {
  runnerRemoteThreatTargetingDiagnosticsForAction,
  type RunnerRemoteThreatProfile,
} from "./remote-server-threat";

const run: LegalAction = {
  actionId: "runner.start_run.remote_1",
  type: "start_run",
  side: "runner",
  label: "Run remote",
  source: "basic_action",
  timingPoint: "runner_action.main",
  expiresAtStateVersion: 1,
  visibility: "public",
  costs: [{ clicks: 1 }],
  payload: { serverId: "remote_1" },
  targetRequirements: [],
};

it.each(["coverage", "cost", "reserve"] as const)(
  "distinguishes a %s block from running below the post-run reserve",
  (block) => {
    const input = { side: "runner", legalActions: [run] } as AiDecisionInput;
    const profile: RunnerRemoteThreatProfile = {
      serverId: "remote_1",
      advanced: true,
      relevantTrash: false,
      blockedByBreakerCoverage: block === "coverage",
      blockedByKnownIceCost: block === "cost",
      blockedByPostRunReserve: block === "reserve",
      creditsAfterPath: 1,
      postRunReserveTarget: 2,
      contestable: false,
    };
    const diagnostics = runnerRemoteThreatTargetingDiagnosticsForAction(
      input,
      run,
      "remote_1",
      {
        runnerRemoteThreatProfile: () => profile,
        runnerCentralRunHasClearPressureJustification: () => false,
        runnerCentralRunPressureJustificationReasons: () => [],
        runnerCentralRunBurnsRemoteContestReserve: () => false,
      },
    );
    expect(diagnostics.runnerContestedAdvancedRemoteServerId).toBe("remote_1");
    expect(
      diagnostics.runnerRemoteRunStartedWithInsufficientPostRunReserve === true,
    ).toBe(block === "reserve");
  },
);
