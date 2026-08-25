import { describe, expect, it } from "vitest";

import resolvedFutureDamageJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-c41a-085-resolved-future-encounter-damage.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match c41a runner resolved future damage decision checkpoint", () => {
  it("jacks out under the existing remote contest plan after the source resolves", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(resolvedFutureDamageJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.actionId).toBe("runner.jack_out");
    expect(
      result.decision?.decisionDebug?.planFirstDecision?.assessmentEvidenceCodes,
    ).toContain(
      "runner_future_encounter_damage_requires_jack_out|source:onr_v1_242_fatal-attractor|damage:3|hand:4|projected_hand:1|required_floor:4",
    );
    expect(result.decision?.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      leafExecutorInstanceId:
        "plan:runner.convert_run_window:run%3Arun_82",
      selectedStep: {
        planInstanceId: "plan:runner.convert_run_window:run%3Arun_82",
        parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      },
    });
  });
});
