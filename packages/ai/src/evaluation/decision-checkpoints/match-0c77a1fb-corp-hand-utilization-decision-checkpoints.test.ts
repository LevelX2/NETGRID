import { describe, expect, it } from "vitest";

import accountsBeforeDefenseDrawJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-0c77a1fb-02-accounts-before-defense-draw-d5.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 0c77a1fb Corp hand-utilization checkpoints", () => {
  it("converts Accounts Receivable instead of spending the last click on a speculative defense draw", () => {
    const result = runAiDecisionCheckpoint(
      accountsBeforeDefenseDrawJson as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});
