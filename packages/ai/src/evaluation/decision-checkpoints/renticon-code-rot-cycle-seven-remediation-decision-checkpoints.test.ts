import { describe, expect, it } from "vitest";
import { hashGameState } from "@netgrid/engine";

import noNeedSearchJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c7-01-no-need-search-seed001-d122.json";
import unrezzableMatchpointIceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c7-02-unrezzable-matchpoint-ice-seed002-d404.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

const FIXTURES = [
  [
    "installs currently available restricted run income before funding setup",
    noNeedSearchJson,
  ],
  [
    "scores instead of installing unrezzable matchpoint ice",
    unrezzableMatchpointIceJson,
  ],
] as const;

describe("Rent-I-Con versus CODE ROT cycle-seven remediation checkpoints", () => {
  it.each(FIXTURES)("%s", (_label, checkpoint) => {
    const current = structuredClone(checkpoint) as AiDecisionCheckpointV1;
    if (checkpoint === noNeedSearchJson)
      current.expectation = {
        acceptableActions: [
          {
            actionId:
              "runner.install_card.runner_onr_v1_035_invisibility_1.runner_onr_v1_035_invisibility_1",
          },
        ],
        planExecution: {
          acceptablePlanKinds: ["runner.recurring_economy"],
          acceptableCapabilities: ["recurring_economy_install"],
          requiredAssessmentEvidence: [
            "runner_restricted_run_economy_install_ready",
          ],
        },
      };
    const result = runAiDecisionCheckpoint(current);

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("retains the original setup funding when the free recurring source is unavailable", () => {
    const checkpoint = structuredClone(
      noNeedSearchJson,
    ) as AiDecisionCheckpointV1;
    const state = checkpoint.engine.testOnlyGameState;
    const id = "runner_onr_v1_035_invisibility_1";
    state.runner.grip = state.runner.grip.filter((cardId) => cardId !== id);
    state.runner.stack.push(id);
    Object.assign(state.cardInstances[id]!, {
      zone: { side: "runner", zone: "stack" },
      faceup: false,
      rezzed: false,
    });
    checkpoint.source.kind = "synthetic_companion";
    checkpoint.engine.stateHash = hashGameState(state);
    const result = runAiDecisionCheckpoint(checkpoint);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});
