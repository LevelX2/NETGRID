import type { CardInstanceId, GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { runnerCostPenaltySupportCreditCapacity } from "./runner-payment-support";

describe("runner payment support", () => {
  it("counts only Runner-controlled installed support sources", () => {
    const sourceId = "swiss" as CardInstanceId;
    const state = {
      runner: {
        credits: 0,
        rig: { programs: [], hardware: [], resources: [sourceId] },
      },
      cardInstances: {
        [sourceId]: {
          id: sourceId,
          definitionId: "onr_proteus_152_swiss-bank-account",
          owner: "runner",
          controller: "corp",
          tapped: false,
        },
      },
    } as unknown as GameState;

    expect(runnerCostPenaltySupportCreditCapacity(state)).toBe(0);
    state.cardInstances[sourceId]!.controller = "runner";
    expect(runnerCostPenaltySupportCreditCapacity(state)).toBe(2);
  });
});
