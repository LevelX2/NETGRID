import { describe, expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/corp-highlighter-purge-pressure.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("corp Highlighter purge pressure checkpoint", () => {
  it("purges visible Runner-virus multiaccess pressure", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(checkpointJson) as AiDecisionCheckpointV1,
    );

    expect(result).toMatchObject({ ok: true });
  });
});
