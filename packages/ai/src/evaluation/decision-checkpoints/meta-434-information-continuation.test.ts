import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function checkpoint() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r15-information-continuation.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}

function decide(cp: ReturnType<typeof checkpoint>) {
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const result = chooseAiAction(cp.input);
  return {
    result,
    action: cp.input.legalActions.find(
      (action) => action.actionId === result.actionId,
    ),
  };
}

it("converts the exact information parent to access once the revealed path fits credits and hand", () => {
  const cp = checkpoint();
  const { result, action } = decide(cp);
  expect(action?.type).toBe("break_subroutine");
  expect(result).toMatchObject({
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        selectedStep: {
          planInstanceId: "plan:runner.convert_run_window:run%3Arun_254",
          parentInstanceId: "plan:runner.pressure_central:central%3Ard",
        },
        route: {
          actionId: result.actionId,
          stateVersion: cp.input.playerView.stateVersion,
        },
      },
    },
  });
  expect(JSON.stringify(result.decisionDebug)).toContain(
    "runner_information_boundary_decision:convert_to_access",
  );
});

it.each([0, 1])(
  "retains the information boundary when %i hand cards do not cover the inner damage floor",
  (handCount) => {
    const cp = checkpoint();
    cp.input.playerView.own.gripOrHq = cp.input.playerView.own.gripOrHq.slice(
      0,
      handCount,
    );
    expect(decide(cp).action?.type).not.toBe("break_subroutine");
  },
);

it("retains the information boundary when the full known path cannot be paid", () => {
  const cp = checkpoint();
  cp.input.playerView.own.credits = 5;
  expect(decide(cp).action?.type).not.toBe("break_subroutine");
});
