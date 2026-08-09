import type { CardInstanceId, GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { CardCapabilityAuthoritySources } from "../../ability-engine/card-capability-binding";
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

  it("uses the exact CardSpec authority without a legacy fallback", () => {
    const sourceId = "swiss" as CardInstanceId;
    const definitionId = "onr_proteus_152_swiss-bank-account";
    const state = {
      runner: {
        credits: 0,
        rig: { programs: [], hardware: [], resources: [sourceId] },
      },
      cardInstances: {
        [sourceId]: {
          id: sourceId,
          definitionId,
          owner: "runner",
          controller: "runner",
          tapped: false,
        },
      },
    } as unknown as GameState;
    const canonicalSources = {
      engineCardForDefinitionId: () =>
        ({
          engine: {
            abilities: [
              {
                kind: "activated",
                capabilityKey: "support_credit",
                addressability: ["action"],
                timing: "runner_cost_penalty_support",
                costs: [],
                effects: [
                  { kind: "gain_credits", recipient: "runner", amount: 2 },
                ],
              },
            ],
          },
        }) as never,
      legacyImplementationForDefinitionId: () => undefined,
    } satisfies CardCapabilityAuthoritySources;
    expect(
      runnerCostPenaltySupportCreditCapacity(state, canonicalSources),
    ).toBe(2);

    const hybridSources = {
      ...canonicalSources,
      legacyImplementationForDefinitionId: () => ({ abilities: [] }) as never,
    } satisfies CardCapabilityAuthoritySources;
    expect(() =>
      runnerCostPenaltySupportCreditCapacity(state, hybridSources),
    ).toThrow(/gleichzeitig CardSpec- und Legacy/);
  });
});
