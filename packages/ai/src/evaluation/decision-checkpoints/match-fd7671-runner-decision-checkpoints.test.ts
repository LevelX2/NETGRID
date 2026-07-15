import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import noNeedTutorJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fd7671-01-no-need-tutor-plan.json";
import centralTrashJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fd7671-02-matchpoint-central-trash-reserve.json";
import releaseRunLockJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fd7671-03-release-run-lock.json";
import exposeTargetJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fd7671-04-expose-valuable-position.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match FD7671 runner decision checkpoints", () => {
  it.each([
    [
      "does not let a no-need tutor plan suppress the free HQ run",
      noNeedTutorJson,
    ],
    [
      "preserves the matchpoint run reserve over central economy trash",
      centralTrashJson,
    ],
    [
      "pays to release the run lock while a follow-up run remains",
      releaseRunLockJson,
    ],
    ["exposes the valuable unseen remote-root position", exposeTargetJson],
  ])("%s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("does not release the run lock without a click for the follow-up run", () => {
    const noFollowUpClick = mutateFixture(releaseRunLockJson, (checkpoint) => {
      checkpoint.engine.testOnlyGameState.runner.clicks = 1;
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "FD7671-C01-NO-FOLLOW-UP-CLICK";
      checkpoint.expectation = {
        forbiddenActions: [{ actionId: "runner.trigger_ability" }],
      };
    });

    expectCheckpointToPass(noFollowUpClick);
  });

  it("still trashes central economy when credits cover the reserve", () => {
    const surplusCredits = mutateFixture(centralTrashJson, (checkpoint) => {
      checkpoint.engine.testOnlyGameState.runner.credits = 12;
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "FD7671-C03-TRASH-SURPLUS";
      checkpoint.expectation = {
        acceptableActions: [{ type: "trash_accessed_card" }],
      };
    });

    expectCheckpointToPass(surplusCredits);
  });

  it("keeps the sole legal expose target selectable", () => {
    const soleTarget = mutateFixture(exposeTargetJson, (checkpoint) => {
      const pendingChoice = checkpoint.engine.testOnlyGameState.pendingChoice;
      if (!pendingChoice) throw new Error("Expected expose choice");
      pendingChoice.options = pendingChoice.options.filter(
        (option) => option.id === "card_hidden_4ff3e639",
      );
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "FD7671-C04-SOLE-EXPOSE-TARGET";
      checkpoint.expectation = {
        choice: { mustSelectOptionIds: ["card_hidden_4ff3e639"] },
      };
    });

    expectCheckpointToPass(soleTarget);
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
