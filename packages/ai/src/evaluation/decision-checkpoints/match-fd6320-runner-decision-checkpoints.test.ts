import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import centralTargetQualityJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fd6320-01-central-target-quality.json";
import reachableHqMatchpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fd6320-02-reachable-hq-matchpoint.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("match FD6320 runner decision checkpoints", () => {
  it("keeps the materially better open HQ run above a riskier repeated R&D run", () => {
    expectCheckpointToPass(fixture(centralTargetQualityJson));
  });

  it("converts a reachable open HQ run at matchpoint before slow hand development", () => {
    expectCheckpointToPass(fixture(reachableHqMatchpointJson));
  });

  it("keeps R&D preferred when its path becomes materially better", () => {
    const freshRnd = mutateFixture(centralTargetQualityJson, (checkpoint) => {
      checkpoint.engine.eventPrefix = checkpoint.engine.eventPrefix.filter(
        (event) =>
          event.type !== "start_run" &&
          event.type !== "access_card" &&
          event.type !== "decline_trash",
      );
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "FD6320-C01-FRESH-RD-REMAINS-PREFERRED";
      checkpoint.expectation = {
        acceptableActions: [{ type: "start_run", targetServerId: "rd" }],
      };
    });

    expectCheckpointToPass(freshRnd);
  });

  it("funds the hand instead of drawing into overflow below matchpoint", () => {
    const belowMatchpoint = mutateFixture(
      reachableHqMatchpointJson,
      (checkpoint) => {
        const state = checkpoint.engine.testOnlyGameState;
        const agendaId = state.runner.scoreArea.at(-1);
        if (!agendaId) throw new Error("Expected a scored Runner agenda");
        state.runner.scoreArea = state.runner.scoreArea.filter(
          (instanceId) => instanceId !== agendaId,
        );
        state.runner.heap.push(agendaId);
        state.cardInstances[agendaId] = {
          ...state.cardInstances[agendaId]!,
          zone: { side: "runner", zone: "heap" },
          faceup: true,
          rezzed: false,
        };
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.source.findingId = "FD6320-C02-NO-MATCHPOINT-FORCE";
        checkpoint.expectation = {
          acceptableActions: [{ type: "gain_credit" }],
        };
      },
    );

    expectCheckpointToPass(belowMatchpoint);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  const checkpoint = bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    ["FD6320-F01-central-target-quality", "FD6320-F02-reachable-hq-matchpoint"],
  );
  if (checkpoint.checkpointId === "FD6320-F02-reachable-hq-matchpoint") {
    checkpoint.expectation.planExecution!.acceptableCapabilities = [
      "pressure_hq_access",
    ];
  }
  return checkpoint;
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
