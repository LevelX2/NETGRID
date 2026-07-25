import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import delayedEconomyReserveJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-c6eedf46-01-delayed-economy-reserve.json";
import immediateEconomyJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e8886-06-livewire-real-economy.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match C6EEDF46 runner risk and economy checkpoints", () => {
  it("preserves a reserve instead of spending the last credits on delayed economy", () => {
    expectCheckpointToPass(fixture(delayedEconomyReserveJson));
  });

  it("keeps delayed economy legal but continues strategic wall coverage after R&D cadence is consumed", () => {
    const fundedDelayedEconomy = mutateFixture(
      delayedEconomyReserveJson,
      (checkpoint) => {
        checkpoint.engine.testOnlyGameState.runner.credits = 10;
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.source.findingId =
          "C6EEDF46-C01-FUNDED-DELAYED-ECONOMY";
        checkpoint.expectation = {
          acceptableActions: [
            {
              type: "install_card",
              sourceDefinitionId: "onr_v1_021_dwarf",
            },
          ],
          planExecution: {
            acceptablePlanKinds: ["runner.rig_and_coverage"],
            acceptableCapabilities: ["install_breaker_wall"],
            requiredAssessmentEvidence: [
              "deck_strategy_open_wall_coverage",
            ],
          },
        };
      },
    );

    const result = runAiDecisionCheckpoint(fundedDelayedEconomy);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    const riggedInvestmentsInstanceId =
      result.input.playerView.own.gripOrHq.find(
        (card) =>
          card.definitionId === "onr_v1_174_rigged-investments",
      )?.instanceId;
    expect(riggedInvestmentsInstanceId).toBeDefined();
    expect(
      result.input.legalActions.some(
        (action) =>
          action.type === "install_card" &&
          action.source === riggedInvestmentsInstanceId,
      ),
    ).toBe(true);
  });

  it("keeps an immediate net-positive economy action available", () => {
    expectCheckpointToPass(fixture(immediateEconomyJson));
  });

  it("does not expose the later damage cards to the historical decision", () => {
    const checkpoint = fixture(delayedEconomyReserveJson);
    const serializedPublicPrefix = JSON.stringify(checkpoint.engine.eventPrefix);

    expect(serializedPublicPrefix).not.toContain("onr_v1_284_chance-observation");
    expect(serializedPublicPrefix).not.toContain("onr_v1_307_urban-renewal");
    expect(serializedPublicPrefix).not.toContain("Chance Observation");
    expect(serializedPublicPrefix).not.toContain("Urban Renewal");
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    ["cp-c6eedf46-01-delayed-economy-reserve"],
  );
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
