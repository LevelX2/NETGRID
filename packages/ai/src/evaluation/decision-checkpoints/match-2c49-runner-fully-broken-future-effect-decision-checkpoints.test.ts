import { describe, expect, it } from "vitest";

import fullyBrokenFutureEffectJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-2c49-096-fully-broken-future-effect.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 2c49 runner fully broken future effect decision checkpoint", () => {
  it("ignores the fully broken future effect while the visible damage floor still aborts the route", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(fullyBrokenFutureEffectJson) as unknown as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.actionId).toBe("rd");
    expect(
      result.decision?.decisionDebug?.planFirstDecision?.assessmentEvidenceCodes.some(
        (evidence) =>
          evidence.startsWith(
            "runner_future_encounter_damage_requires_jack_out|",
          ),
      ) ?? false,
    ).toBe(false);
    expect(result.decision?.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "p1p4xezjcxov79rno40lq3f7rv",
      leafExecutorInstanceId: "p8kyx053fdf6jdaq38j06j4jv5",
      selectedStep: {
        planInstanceId: "p8kyx053fdf6jdaq38j06j4jv5",
        parentInstanceId: "p1p4xezjcxov79rno40lq3f7rv",
      },
    });
  });
});
