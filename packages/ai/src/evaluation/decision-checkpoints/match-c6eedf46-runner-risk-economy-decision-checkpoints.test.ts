import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import delayedEconomyReserveJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-c6eedf46-01-delayed-economy-reserve.json";
import immediateEconomyJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e8886-06-livewire-real-economy.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match C6EEDF46 runner risk and economy checkpoints", () => {
  it("preserves a reserve instead of spending the last credits on delayed economy", () => {
    expectCheckpointToPass(fixture(delayedEconomyReserveJson));
  });

  it("keeps delayed economy installable when the reserve remains funded", () => {
    const fundedDelayedEconomy = mutateFixture(
      delayedEconomyReserveJson,
      (checkpoint) => {
        checkpoint.engine.testOnlyGameState.runner.credits = 10;
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.source.findingId =
          "C6EEDF46-C01-FUNDED-DELAYED-ECONOMY";
        checkpoint.expectation = {
          acceptableActions: [
            { sourceDefinitionId: "onr_v1_174_rigged-investments" },
          ],
        };
      },
    );

    expectCheckpointToPass(fundedDelayedEconomy);
  });

  it("keeps an immediate net-positive economy action available", () => {
    expectCheckpointToPass(fixture(immediateEconomyJson));
  });

  it("does not expose the later damage cards to the historical decision", () => {
    const checkpoint = fixture(delayedEconomyReserveJson);
    const serializedPublicPrefix = JSON.stringify(checkpoint.engine.eventPrefix);

    expect(serializedPublicPrefix).not.toContain("onr_v1_192_chance-observation");
    expect(serializedPublicPrefix).not.toContain("onr_v1_231_urban-renewal");
    expect(serializedPublicPrefix).not.toContain("Chance Observation");
    expect(serializedPublicPrefix).not.toContain("Urban Renewal");
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function mutateFixture(
  value: unknown,
  mutation: (fixture: AiDecisionCheckpointV1) => void,
): AiDecisionCheckpointV1 {
  const result = fixture(value);
  mutation(result);
  result.engine.stateHash = hashGameState(result.engine.testOnlyGameState);
  return result;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
