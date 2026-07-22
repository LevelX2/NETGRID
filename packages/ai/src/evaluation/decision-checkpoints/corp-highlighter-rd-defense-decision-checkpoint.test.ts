import { describe, expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/corp-highlighter-rd-defense.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("corp Highlighter R&D defense checkpoint", () => {
  it("keeps the urgent R&D ICE defense over an unsafe fast-advance setup", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(checkpointJson) as AiDecisionCheckpointV1,
    );

    expect(result).toMatchObject({ ok: true });
  });
});
