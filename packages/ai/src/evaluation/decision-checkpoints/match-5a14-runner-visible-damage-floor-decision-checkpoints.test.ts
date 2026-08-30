import { describe, expect, it } from "vitest";

import runStartJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5a14-089-visible-damage-floor-run-start.json";
import jackOutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5a14-096-visible-damage-floor-jack-out.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 5a14 runner visible damage hand floor checkpoints", () => {
  it("does not start the optional remote run below the confirmed damage floor", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(runStartJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.actionId).not.toBe("runner.start_run.remote_1");
    expect(
      result.input.legalActions.some(
        (action) => action.actionId === "runner.start_run.remote_1",
      ),
    ).toBe(true);
  });

  it("jacks out under the existing run executor if the unsafe route was entered", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(jackOutJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.actionId).toBe("runner.jack_out");
    expect(result.decision?.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_89",
      selectedStep: {
        planInstanceId: "plan:runner.convert_run_window:run%3Arun_89",
        parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      },
    });
  });
});
