import { describe, expect, it } from "vitest";

import resolvedFutureDamageJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-c41a-085-resolved-future-encounter-damage.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match c41a runner resolved future damage decision checkpoint", () => {
  it("jacks out under the existing remote contest plan after the source resolves", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(resolvedFutureDamageJson) as unknown as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.actionId).toBe("rd");
    expect(
      result.decision?.decisionDebug?.planFirstDecision
        ?.assessmentEvidenceCodes,
    ).toContain(
      "runner_future_encounter_damage_requires_jack_out|source:454|damage:3|hand:4|projected_hand:1|required_floor:4",
    );
    expect(result.decision?.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "p1p4xezjcxov79rno40lq3f7rv",
      leafExecutorInstanceId: "p8kyw2m8259x1xx0ftk3rudzhw",
      selectedStep: {
        planInstanceId: "p8kyw2m8259x1xx0ftk3rudzhw",
        parentInstanceId: "p1p4xezjcxov79rno40lq3f7rv",
      },
    });
  });
});
