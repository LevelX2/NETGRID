import { describe, expect, it } from "vitest";

import scoredOnlyTimingJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3bb14-01-scored-only-tag-timing-d39.json";
import realisticScoreHorizonJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3bb14-02-realistic-score-horizon-d40.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 3bb14 Corp remediation decision checkpoints", () => {
  it.each([
    [
      "does not treat an unscored agenda install as persistent tag-engine activation",
      scoredOnlyTimingJson,
    ],
    [
      "protects the remote instead of advancing a scoreline outside its real horizon",
      realisticScoreHorizonJson,
    ],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
