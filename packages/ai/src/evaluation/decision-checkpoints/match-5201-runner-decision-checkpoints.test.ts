import { describe, expect, it } from "vitest";

import preserveWallBreakerJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5201-02-preserve-wall-breaker-d98.json";
import initialHqInformationRunJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5201-01-no-repeat-hq-run-d118.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 5201 runner decision checkpoints", () => {
  it("builds missing AP coverage before the initial HQ information run", () => {
    expectCheckpointToPass(fixture(initialHqInformationRunJson));
  });

  it("preserves the only visible wall breaker against self-inflicted core damage", () => {
    expectCheckpointToPass(fixture(preserveWallBreakerJson));
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
