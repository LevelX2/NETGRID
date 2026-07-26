import { describe, expect, it } from "vitest";

import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3aac-01-corp-first-turn-no-premature-end-d4.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 3aac Corp first-turn regression evidence", () => {
  it("uses remaining first-turn capacity instead of completing the turn", () => {
    const checkpoint = structuredClone(
      checkpointJson,
    ) as AiDecisionCheckpointV1;
    const result = runAiDecisionCheckpoint(checkpoint);

    expect(checkpoint.difficulty).toBe("hard");
    expect(result.input.playerView.own.clicks).toBe(2);
    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
    expect(result.selectedAction?.type).toBe("gain_credit");
  });
});
