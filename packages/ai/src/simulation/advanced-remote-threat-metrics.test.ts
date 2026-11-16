import { describe, expect, it } from "vitest";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { summarizeAdvancedRemoteThreatMetrics } from "./advanced-remote-threat-metrics";

type Entry = AiSimulationSummary["actionSequence"][number];

describe("advanced Remote threat metrics", () => {
  const contestable = { serverId: "remote_1", contestable: true };
  const blocked = {
    serverId: "remote_2",
    contestable: false,
    blocker: "ice_cost",
  } as const;

  it("counts qualifying contests and assigns a block to its own server", () => {
    const actionSequence = [
      entry("remote_1", {
        runnerAdvancedRemoteThreats: [contestable, blocked],
      }),
      entry("remote_2", {
        runnerAdvancedRemoteThreats: [
          { ...blocked, blocker: "post_run_reserve" },
        ],
      }),
      entry("remote_1", { runnerAdvancedRemoteThreats: [contestable] }),
    ];
    expect(
      summarizeAdvancedRemoteThreatMetrics([summary(actionSequence)]),
    ).toMatchObject({
      uniqueAdvancedRemoteThreats: 2,
      contestableAdvancedRemoteThreats: 1,
      advancedRemoteThreatsContested: 1,
      advancedRemoteThreatContestRate: 1,
      skippedContestableAdvancedRemoteThreats: 0,
      remoteContestBlockedByCredits: 1,
      remoteContestBlockedByKnownIceCost: 1,
      remoteContestBlockedByPostRunReserve: 1,
    });
  });

  it("does not credit a previous attempt when that server later becomes contestable", () => {
    const actionSequence = [
      entry("remote_2", { runnerAdvancedRemoteThreats: [blocked] }),
      entry("hq", {
        runnerAdvancedRemoteThreats: [
          { serverId: "remote_2", contestable: true },
        ],
      }),
    ];
    expect(
      summarizeAdvancedRemoteThreatMetrics([summary(actionSequence)]),
    ).toMatchObject({
      advancedRemoteThreatsContested: 0,
      advancedRemoteThreatContestRate: 0,
      skippedContestableAdvancedRemoteThreats: 1,
    });
  });
});

function entry(targetServerId: string, overrides: Partial<Entry>): Entry {
  return {
    side: "runner",
    actionType: "start_run",
    turnNumber: 1,
    targetServerId,
    runnerContestedAdvancedRemoteServerId: targetServerId,
    ...overrides,
  } as Entry;
}

function summary(actionSequence: Entry[]): AiSimulationSummary {
  return { seed: "remote-metrics", actionSequence } as AiSimulationSummary;
}
