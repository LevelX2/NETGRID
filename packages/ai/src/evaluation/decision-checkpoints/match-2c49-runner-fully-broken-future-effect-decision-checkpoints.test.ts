import { describe, expect, it } from "vitest";

import fullyBrokenFutureEffectJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-2c49-096-fully-broken-future-effect.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 2c49 runner fully broken future effect decision checkpoint", () => {
  it("continues under the existing remote contest plan after fully breaking the source", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(fullyBrokenFutureEffectJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.actionId).toBe("runner.continue_run");
    expect(result.decision?.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      leafExecutorInstanceId:
        "plan:runner.convert_run_window:run%3Arun_89",
      selectedStep: {
        planInstanceId: "plan:runner.convert_run_window:run%3Arun_89",
        parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      },
    });
  });
});
