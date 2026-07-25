import { describe, expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/corp-highlighter-rd-defense.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("corp Highlighter R&D defense checkpoint", () => {
  it("purges a critical visible R&D multiaccess threat", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(checkpointJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, result.message).toBe(true);
    expect(result.decision?.decisionDebug?.visibleReasons).toContain(
      "plan_assessment_evidence:visible_runner_virus_counters",
    );
    expect(result.decision?.decisionDebug?.visibleReasons).toContain(
      "plan_priority_class:P2",
    );
  });
});
