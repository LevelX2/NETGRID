import { describe, expect, it } from "vitest";
import ineffectivePurgeJson from "../../../../../data/scenarios/ai-decision-checkpoints/corp-ineffective-virus-purge-d88.json";
import purgeLoopJson from "../../../../../data/scenarios/ai-decision-checkpoints/corp-ineffective-virus-purge-loop-d123.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("corp ineffective virus purge checkpoints", () => {
  it.each([
    ["first inactive-counter purge", ineffectivePurgeJson],
    ["repeated inactive-counter purge", purgeLoopJson],
  ])("rejects the %s", (_label, checkpointJson) => {
    const result = runAiDecisionCheckpoint(
      structuredClone(checkpointJson) as AiDecisionCheckpointV1,
    );

    expect(result).toMatchObject({ ok: true });
  });
});
