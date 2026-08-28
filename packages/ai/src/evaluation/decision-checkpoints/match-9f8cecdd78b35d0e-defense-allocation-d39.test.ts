import { describe, expect, it } from "vitest";

import {
  corpDefenseActionDispositions,
  corpDefenseMaterializedActionIds,
} from "../../plans/corp-core-plan-modules";
import {
  allocateCorpCentralDefense,
  type CorpCentralDefenseFacts,
} from "../../runtime/corp-central-defense-allocation";
import {
  checkpointDefenseCandidate,
  checkpointDefenseContext,
  checkpointInstallDefenseSignal,
  checkpointRemoteProject,
  checkpointRemoteSupportSignal,
} from "./corp-defense-checkpoint.test-support";

describe("match 9f8cecdd78b35d0e Corp defense allocation D39", () => {
  it("reviews HQ, R&D and Remote 1 through state-bound defense evidence", () => {
    const centralAllocation = allocateCorpCentralDefense({
      observedAtStateVersion: 60,
      turnKey: "corp:d39",
      hq: centralFacts("hq", {
        installedIceCount: 2,
        cards: {
          populationCardCount: 5,
          agendaCardCount: 2,
          agendaPointValue: 4,
          importantTrashableCardCount: 0,
        },
        access: {
          successfulAccessProbability: { numerator: 1, denominator: 3 },
          accessibleCardCount: 1,
          isMultiaccess: false,
          recentRunOrAccessEvents: 1,
          recentSuccessfulAccessRunnerTurns: 0,
          serverBoundEffectIds: [],
        },
      }),
      rd: centralFacts("rd", {
        installedIceCount: 1,
        cards: {
          populationCardCount: 8,
          agendaCardCount: 3,
          agendaPointValue: 6,
          importantTrashableCardCount: 1,
        },
        access: {
          successfulAccessProbability: { numerator: 3, denominator: 4 },
          accessibleCardCount: 2,
          isMultiaccess: true,
          recentRunOrAccessEvents: 4,
          recentSuccessfulAccessRunnerTurns: 2,
          serverBoundEffectIds: ["visible_repeated_rd_access"],
        },
      }),
    });
    expect(centralAllocation).toMatchObject({
      status: "known",
      selectedServerId: "rd",
      evidence: {
        hq: { installedIceCount: 2 },
        rd: {
          installedIceCount: 1,
          recentRunOrAccessEvents: 4,
          recentSuccessfulAccessRunnerTurns: 2,
          serverBoundEffectIds: ["visible_repeated_rd_access"],
        },
      },
    });
    if (centralAllocation.status !== "known") {
      throw new Error("D39 fixture requires complete central facts.");
    }

    const hq = checkpointDefenseCandidate("d39-install-hq", "hq", "d39-hq");
    const rd = checkpointDefenseCandidate("d39-install-rd", "rd", "d39-rd");
    const remote = checkpointDefenseCandidate(
      "d39-install-remote-1",
      "remote_1",
      "d39-remote",
    );
    const remoteNeedId = "remote-hardening:strategic-score-remote:4";
    const defenseNeeds = [
      checkpointInstallDefenseSignal({
        candidate: hq,
        serverId: "hq",
        effect: "progress",
        accessProbability: { numerator: 1, denominator: 2 },
        runnerCreditsRemaining: 4,
        totalCredits: 4,
        centralPressure: "material",
      }),
      checkpointInstallDefenseSignal({
        candidate: rd,
        serverId: "rd",
        effect: "progress",
        accessProbability: { numerator: 1, denominator: 4 },
        runnerCreditsRemaining: 1,
        totalCredits: 3,
        centralPressure: "acute",
      }),
      checkpointRemoteSupportSignal({
        candidate: remote,
        parentNeedId: remoteNeedId,
        value: 15,
        accessProbability: { numerator: 1, denominator: 3 },
        runnerCreditsRemaining: 2,
      }),
    ];
    const context = checkpointDefenseContext({
      candidates: [hq, rd, remote],
      defenseNeeds,
      remoteProjects: [checkpointRemoteProject(remoteNeedId)],
      centralDefenseAllocation: centralAllocation,
    });
    const materialized = corpDefenseMaterializedActionIds(
      context,
      defenseNeeds,
      centralAllocation,
    );
    const dispositions = corpDefenseActionDispositions(
      context,
      defenseNeeds,
      centralAllocation,
    );
    const reviewedActionIds = [
      ...materialized,
      ...dispositions.map((entry) => entry.actionId),
    ].sort();

    expect(reviewedActionIds).toEqual(
      [hq.actionId, rd.actionId, remote.actionId].sort(),
    );
    expect(materialized).toEqual(new Set([rd.actionId]));
    const remoteSignal = defenseNeeds.find(
      (signal) => signal.serverId === "remote_1",
    );
    expect(remoteSignal).toMatchObject({
      parentKind: "remote",
      parentNeedId: remoteNeedId,
      installRoute: {
        disposition: "productive",
        projection: {
          effect: "progress",
          before: {
            protection: {
              runnerAccessSuccessProbability: { numerator: 1, denominator: 1 },
            },
          },
          after: {
            protection: {
              runnerAccessSuccessProbability: { numerator: 1, denominator: 3 },
            },
          },
        },
      },
    });
    expect(dispositions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: hq.actionId,
          evidenceCode: expect.stringMatching(
            /reason:(higher_state_bound_urgency|higher_priority_band).*selected:rd:.*d39-install-rd/,
          ),
        }),
        expect.objectContaining({
          actionId: remote.actionId,
          evidenceCode: expect.stringMatching(
            /reason:higher_priority_band.*selected:rd:.*d39-install-rd/,
          ),
        }),
      ]),
    );
    expect(
      dispositions.some((entry) => entry.evidenceCode.includes("technical")),
    ).toBe(false);
  });
});

function centralFacts(
  serverId: "hq" | "rd",
  overrides: Pick<
    CorpCentralDefenseFacts,
    "installedIceCount" | "access" | "cards"
  >,
): CorpCentralDefenseFacts {
  return {
    serverId,
    factsKnown: true,
    threat: serverId === "rd" ? "acute" : "material",
    ...overrides,
  };
}
