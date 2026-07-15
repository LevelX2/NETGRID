import { describe, expect, it } from "vitest";

import disgruntledArchivesJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-four-match-01-disgruntled-archives.json";
import insideJobRdJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-four-match-02-inside-job-rd.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("four-match card-hint decision checkpoints", () => {
  it("does not spend Disgruntled Ice Technician on the historical empty Archives run", () => {
    const result = runAiDecisionCheckpoint(fixture(disgruntledArchivesJson));

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("keeps the historical Inside Job R&D line and quotes its bypassed path as reachable", () => {
    const result = runAiDecisionCheckpoint(fixture(insideJobRdJson));

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    const guidance = result.decision?.decisionDebug?.scoreBreakdown?.find(
      (component) => component.key === "runner_run_target_semantic_guidance",
    );
    expect(guidance?.reason).toContain("path:reachable");
    expect(guidance?.reason).not.toContain("path:blocked_unpayable");
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
