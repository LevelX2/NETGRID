import { describe, expect, it } from "vitest";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import {
  runnerCreditReserveTargetForInput,
  runnerPostRunReserveTargetForRemoteInput,
} from "./runner-credit-reserve";

describe("runner credit reserve", () => {
  it("uses remote tax roles only for the concrete active run", () => {
    expect(reserveForRoles(["access_tax"])).toBe(4);
    expect(reserveForRoles(["access_tax"], true)).toBe(8);
    expect(reserveForRoles(["access_taxish_noise"])).toBe(4);
    expect(postRunReserveForRoles(["scoring_protection"])).toBe(6);
    expect(postRunReserveForRoles(["scoring_protectionish_noise"])).toBe(2);
  });
});

function reserveForRoles(roles: string[], activeRun = false): number {
  return runnerCreditReserveTargetForInput(input(activeRun), () => roles);
}

function postRunReserveForRoles(roles: string[]): number {
  return runnerPostRunReserveTargetForRemoteInput(input(), "remote_1", {
    remoteServerHasScoreThreat: () => false,
    rolesForCardId: () => roles,
  });
}

function input(activeRun = false): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      own: {
        credits: 6,
        rig: [],
      },
      servers: [
        {
          id: "remote_1",
          ice: [],
          root: [
            {
              instanceId: "root",
              definitionId: "root_definition",
              known: true,
              type: "agenda",
              advancementCounters: 1,
            } as VisibleCard,
          ],
        },
      ],
      ...(activeRun
        ? {
            run: {
              attackedServerId: "remote_1",
              phase: "encounter",
              successful: false,
            },
          }
        : {}),
    },
  } as unknown as AiDecisionInput;
}
