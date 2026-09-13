import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const checkpoint = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r13-tax-funding-g6.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};

it.each([8, 9, 10, 11])(
  "quotes a two-credit encounter tax instead of an unnecessary ten-credit break with %i credits",
  (credits) => {
    const input = structuredClone(checkpoint.input);
    input.playerView.own.credits = credits;
    const target = evaluateRunnerRunTargets({ input }).find(
      (candidate) => candidate.actionId === "runner.start_run.remote_1",
    );
    // Wall of Static: six; Ball and Chain's tax: two; inner Data Wall: two.
    expect(target).toMatchObject({
      pathCost: 10,
      creditsAfterRun: credits - 10,
    });
    expect(target?.routeQuote?.fundingGap).toBe(Math.max(0, 10 - credits));
  },
);

it("continues the exact remote funding parent instead of running on R&D", () => {
  const { input, runtime } = structuredClone(checkpoint);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const action = input.legalActions.find(
    (candidate) => candidate.actionId === "runner.gain_credit",
  )!;
  expect(chooseAiAction(input)).toMatchObject({
    actionId: action.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        selectedStep: {
          parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
          planInstanceId: "plan:runner.economy:run-support%3Aremote%3Aremote_1",
          needId: "run-support:remote:remote_1",
        },
        route: {
          actionId: action.actionId,
          stateVersion: input.playerView.stateVersion,
        },
      },
    },
  });
});
