import { describe, expect, it } from "vitest";

import remoteFundingJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-802f-03-remote-fund-before-score-threat-probe-d13.json";
import schematicsJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-802f-01-schematics-no-title-search-d17.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 802F search-role and remote-probe decision checkpoints", () => {
  it("does not classify Schematics Search Engine as a deck-search engine", () => {
    expectCheckpointToPass(fixture(schematicsJson));
  });

  it("funds a score-threat remote probe when its own evaluation says to do so", () => {
    expectCheckpointToPass(fixture(remoteFundingJson));
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
