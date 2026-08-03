import { describe, expect, it } from "vitest";

import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/runner-hq-visible-rez-path.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("Runner HQ visible rez path decision checkpoint", () => {
  it("does not start an HQ run that a visible during-run rez makes unaffordable", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(checkpointJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
  });
});
