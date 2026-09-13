import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { currentRunAbortAssessment } from "../../runner/run-window/run-window-assessment";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function checkpoint() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r15-neural-continuation.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}

it("continues the exact R&D parent when the remaining known damage fits the hand budget", () => {
  const { input, runtime } = checkpoint();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  expect(currentRunAbortAssessment(input, undefined)).toBeUndefined();
  const result = chooseAiAction(input);
  expect(
    input.legalActions.find((action) => action.actionId === result.actionId)
      ?.type,
  ).toBe("continue_run");
  expect(result).toMatchObject({
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        selectedStep: {
          planInstanceId: "plan:runner.convert_run_window:run%3Arun_71",
          parentInstanceId: "plan:runner.pressure_central:central%3Ard",
        },
        route: {
          actionId: result.actionId,
          stateVersion: input.playerView.stateVersion,
        },
      },
    },
  });
});

it.each([0, 1])(
  "retains the current damage safety barrier with only %i hand cards",
  (handCount) => {
    const { input } = checkpoint();
    input.playerView.own.gripOrHq = input.playerView.own.gripOrHq.slice(
      0,
      handCount,
    );
    expect(currentRunAbortAssessment(input, undefined)).toBeDefined();
  },
);
