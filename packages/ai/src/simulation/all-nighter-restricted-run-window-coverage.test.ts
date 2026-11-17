import { describe, expect, it } from "vitest";

import allNighterJson from "../../../../data/scenarios/ai-decision-checkpoints/cp-82b2-01-all-nighter-rd-bonus-d5.json";
import type { AiDecisionCheckpointV1 } from "../evaluation/decision-checkpoints/checkpoint-types";
import { runAiDecisionCheckpoint } from "../evaluation/decision-checkpoints/checkpoint-runner";

describe("All-Nighter restricted run-window plan-first coverage", () => {
  it("keeps the captured Engine window bound to its exact profitable bonus-run target", () => {
    const checkpoint = structuredClone(
      allNighterJson,
    ) as AiDecisionCheckpointV1;

    expect(checkpoint.expectation).toMatchObject({
      acceptableActions: [
        {
          actionId: "runner.start_run.rd.bonus_run.288",
        },
      ],
      forbiddenActions: [
        {
          actionId: "runner.start_run.archives.bonus_run.288",
        },
      ],
      planExecution: {
        acceptablePlanKinds: ["runner.convert_run_window"],
        acceptableCapabilities: ["continue_engine_restricted_run_sequence"],
      },
    });

    const result = runAiDecisionCheckpoint(checkpoint);

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});
