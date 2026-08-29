import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import delayedEconomyReserveJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-c6eedf46-01-delayed-economy-reserve.json";
import immediateEconomyJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e8886-06-livewire-real-economy.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match C6EEDF46 runner risk and economy checkpoints", () => {
  it("funds the current R&D-interface plan instead of spending the reserve on delayed economy", () => {
    const result = runAiDecisionCheckpoint(fixture(delayedEconomyReserveJson));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(
      result.decision?.decisionDebug?.planFirstDecision?.executionOrigin
        ?.rootPlanInstanceId,
    ).toBe(
      "plan:runner.develop_board_and_hand:card%3Arunner_onr_v1_139_r-and-d-interface_2",
    );
  });

  it("uses the funded R&D-interface preparation route after R&D cadence is consumed", () => {
    const fundedDelayedEconomy = mutateFixture(
      delayedEconomyReserveJson,
      (checkpoint) => {
        checkpoint.engine.testOnlyGameState.runner.credits = 10;
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.source.findingId = "C6EEDF46-C01-FUNDED-DELAYED-ECONOMY";
        checkpoint.expectation = {
          acceptableActions: [
            {
              type: "install_card",
              sourceDefinitionId: "onr_v1_139_r-and-d-interface",
            },
          ],
          planExecution: {
            acceptablePlanKinds: ["runner.pressure_central"],
            acceptableCapabilities: ["develop_onr_v1_139_r-and-d-interface"],
            requiredAssessmentEvidence: [
              "central_pressure_preparation_actions:1",
            ],
          },
        };
      },
    );

    const result = runAiDecisionCheckpoint(fundedDelayedEconomy);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    const riggedInvestmentsInstanceId =
      result.input.playerView.own.gripOrHq.find(
        (card) => card.definitionId === "onr_v1_174_rigged-investments",
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
    const result = runAiDecisionCheckpoint(fixture(immediateEconomyJson));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(
      result.decision?.decisionDebug?.planFirstDecision?.executionOrigin
        ?.rootPlanInstanceId,
    ).toBe("plan:runner.economy:runner-portfolio-credit-reserve");
  });

  it("does not expose the later damage cards to the historical decision", () => {
    const checkpoint = fixture(delayedEconomyReserveJson);
    const serializedPublicPrefix = JSON.stringify(
      checkpoint.engine.eventPrefix,
    );

    expect(serializedPublicPrefix).not.toContain(
      "onr_v1_284_chance-observation",
    );
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
