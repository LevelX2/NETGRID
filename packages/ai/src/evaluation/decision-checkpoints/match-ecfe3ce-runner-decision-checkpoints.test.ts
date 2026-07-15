import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import sharedPathBudgetJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-01-shared-visible-path-budget.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";

describe("match ECFE3CE runner decision checkpoints", () => {
  it("charges guaranteed Rex avoidance before the later Krash break path", () => {
    expectCheckpointToPass(fixture(sharedPathBudgetJson));
  });

  it("keeps the same fully visible remote runnable with enough reserve", () => {
    const funded = mutateFixture(sharedPathBudgetJson, (checkpoint) => {
      checkpoint.engine.testOnlyGameState.runner.credits = 10;
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "ECFE3CE-C01-FUNDED-REMOTE";
      checkpoint.expectation = {
        runTargets: [
          {
            targetServerId: "remote_1",
            pathCost: 8,
            creditsAfterRun: 2,
            pathPassability: "reachable",
          },
        ],
      };
    });

    expectCheckpointToPass(funded);
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
  const remote = evaluateRunnerRunTargets({ input: result.input }).filter(
    (evaluation) => evaluation.targetServerId === "remote_1",
  );
  expect(
    result.ok,
    `${result.code}: ${result.message}\n${JSON.stringify(remote, null, 2)}`,
  ).toBe(true);
}
