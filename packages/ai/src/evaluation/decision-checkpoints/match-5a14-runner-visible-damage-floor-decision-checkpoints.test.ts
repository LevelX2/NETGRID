import { describe, expect, it } from "vitest";

import runStartJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5a14-089-visible-damage-floor-run-start.json";
import jackOutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5a14-096-visible-damage-floor-jack-out.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 5a14 runner visible damage hand floor checkpoints", () => {
  it("does not start the optional remote run below the confirmed damage floor", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(runStartJson) as unknown as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.actionId).not.toBe("rs.r1");
    expect(
      result.input.legalActions.some(
        (action) => action.actionId === "rs.r1",
      ),
    ).toBe(true);
  });

  it("jacks out under the existing run executor if the unsafe route was entered", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(jackOutJson) as unknown as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.actionId).toBe("rd");
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
