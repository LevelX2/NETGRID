import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import librarySearchRoleJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-b34e-01-library-search-semantic-role-d69.json";
import tutorRoleJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-b34e-02-tutor-source-semantic-role-d106.json";
import closeoutDrawD91Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-b34e-03-closeout-over-overflow-draw-d91.json";
import closeoutElenaD92Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-b34e-04-closeout-over-elena-install-d92.json";
import closeoutBlackBoxD94Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-b34e-05-closeout-over-black-box-install-d94.json";
import productiveD97Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-b34e-06-productive-action-over-overflow-draw-d97.json";
import closeoutDrawD101Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-b34e-07-closeout-over-setup-draw-d101.json";
import closeoutNetworkingD102Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-b34e-08-closeout-over-networking-d102.json";
import remoteAnswerDrawD104Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-b34e-09-urgent-remote-answer-draw-control-d104.json";
import viral15SpendD54Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-b34e-10-viral15-minimal-encounter-spend-d54.json";
import jackOutFireWallD92Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9fef-14-jack-out-fire-wall-control-d92.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

const PSYCHIC_FRIEND_ID = "runner_onr_classic_030_psychic-friend_1";

describe("match B34E runner decision checkpoints", () => {
  it.each([
    [
      "does not classify Library Search as coverage search",
      librarySearchRoleJson,
    ],
    [
      "does not classify a Corp Tutor continuation as setup search",
      tutorRoleJson,
    ],
    [
      "chooses the open HQ closeout over overflow draw at D91",
      closeoutDrawD91Json,
    ],
    ["chooses the open HQ closeout over Elena at D92", closeoutElenaD92Json],
    [
      "chooses the open HQ closeout over Little Black Box at D94",
      closeoutBlackBoxD94Json,
    ],
    [
      "uses a productive final click instead of overflow draw at D97",
      productiveD97Json,
    ],
    [
      "chooses immediate closeout pressure over setup draw at D101",
      closeoutDrawD101Json,
    ],
    [
      "chooses immediate closeout pressure over Networking at D102",
      closeoutNetworkingD102Json,
    ],
    [
      "continues through Viral-15 without unnecessary spending at D54",
      viral15SpendD54Json,
    ],
  ])("%s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("keeps answer draw available before an urgent remote contest", () => {
    expectCheckpointToPass(fixture(remoteAnswerDrawD104Json));
  });

  it("keeps a real jack-out safety decision available", () => {
    expectCheckpointToPass(fixture(jackOutFireWallD92Json));
  });

  it("protects another installed program from Viral-15", () => {
    const valuableProgram = mutateFixture(viral15SpendD54Json, (checkpoint) => {
      const state = checkpoint.engine.testOnlyGameState;
      state.runner.grip = state.runner.grip.filter(
        (instanceId) => instanceId !== PSYCHIC_FRIEND_ID,
      );
      state.runner.rig.programs.push(PSYCHIC_FRIEND_ID);
      state.runner.memoryUsed += 1;
      state.cardInstances[PSYCHIC_FRIEND_ID] = {
        ...state.cardInstances[PSYCHIC_FRIEND_ID]!,
        zone: { side: "runner", zone: "rig" },
      };
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "B34E-C02-VIRAL15-VALUABLE-PROGRAM";
      checkpoint.expectation = {
        acceptableActions: [{ type: "pump_breaker" }],
      };
    });

    expectCheckpointToPass(valuableProgram);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function mutateFixture(
  value: unknown,
  mutation: (fixture: AiDecisionCheckpointV1) => void,
): AiDecisionCheckpointV1 {
  const result = fixture(value);
  mutation(result);
  result.engine.stateHash = hashGameState(result.engine.testOnlyGameState);
  return result;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
