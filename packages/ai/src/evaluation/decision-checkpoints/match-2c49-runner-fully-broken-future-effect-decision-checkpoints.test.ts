import { describe, expect, it } from "vitest";

import fullyBrokenFutureEffectJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-2c49-096-fully-broken-future-effect.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 2c49 runner fully broken future effect decision checkpoint", () => {
  it("ignores the fully broken future effect while the visible damage floor still aborts the route", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(fullyBrokenFutureEffectJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.actionId).toBe("runner.jack_out");
    expect(
      result.decision?.decisionDebug?.planFirstDecision?.assessmentEvidenceCodes.some(
        (evidence) =>
          evidence.startsWith(
            "runner_future_encounter_damage_requires_jack_out|",
          ),
      ) ?? false,
    ).toBe(false);
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
