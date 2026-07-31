import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import overflowBeforeCoverageJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-a36a-postfix-01-install-coverage-before-guaranteed-overflow-d45.json";
import retainUniqueCoverageJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-a36a-postfix-02-retain-unique-coverage-d47.json";
import shellExactTargetJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-a36a-postfix-03-shell-traders-exact-target-d107.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("A36A postfix runner engine remediation checkpoints", () => {
  it("installs acute unique coverage instead of creating guaranteed valuable overflow", () => {
    expectCheckpointToPass(fixture(overflowBeforeCoverageJson));
  });

  it("retains the unique provider of an open coverage need during cleanup", () => {
    expectCheckpointToPass(fixture(retainUniqueCoverageJson));
  });

  it("materializes the Shell Traders route only for its exact target", () => {
    expectCheckpointToPass(fixture(shellExactTargetJson));
  });

  it("still permits the draw engine when enough cleanup capacity exists", () => {
    const checkpoint = mutateFixture(overflowBeforeCoverageJson, (result) => {
      result.source.kind = "synthetic_companion";
      result.source.findingId = "A36A-POSTFIX-D45-ROOMY-HAND-CONTROL";
      result.engine.testOnlyGameState.runner.maxHandSize = 10;
      result.expectation = {
        acceptableActions: [
          {
            type: "play_event",
            sourceDefinitionId: "onr_v1_079_bodyweight-synthetic-blood",
          },
        ],
      };
    });

    expectCheckpointToPass(checkpoint);
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
