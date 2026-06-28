import { describe, expect, it } from "vitest";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import {
  runnerCreditReserveTargetForInput,
  runnerPostRunReserveTargetForRemoteInput,
} from "./runner-credit-reserve";

describe("runner credit reserve", () => {
  it("matches remote tax roles by bounded role terms", () => {
    expect(reserveForRoles(["access_tax"])).toBe(8);
    expect(reserveForRoles(["access_taxish_noise"])).toBe(4);
    expect(postRunReserveForRoles(["scoring_protection"])).toBe(6);
    expect(postRunReserveForRoles(["scoring_protectionish_noise"])).toBe(2);
  });
});

function reserveForRoles(roles: string[]): number {
  return runnerCreditReserveTargetForInput(input(), () => roles);
}

function postRunReserveForRoles(roles: string[]): number {
  return runnerPostRunReserveTargetForRemoteInput(input(), "remote_1", {
    remoteServerHasScoreThreat: () => false,
    rolesForCardId: () => roles,
  });
}

function input(): AiDecisionInput {
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
    },
  } as unknown as AiDecisionInput;
}
