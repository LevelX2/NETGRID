import { describe, expect, it } from "vitest";

import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-b0b0-emergency-discard-keep-d65.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match B0B0 runner emergency discard checkpoint", () => {
  it("retains flatline prevention while the defense plan confirms lethal pressure", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(checkpointJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});
