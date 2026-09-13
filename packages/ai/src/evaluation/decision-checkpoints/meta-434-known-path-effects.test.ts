import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function checkpoint(game: number) {
  return JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r14-known-path-g${game}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}

it.each([37, 38, 40])(
  "retains real coverage and the complete known access cost at %i credits",
  (credits) => {
    const { input } = checkpoint(11);
    input.playerView.own.credits = credits;
    const target = evaluateRunnerRunTargets({ input }).find(
      (t) => t.actionId === "runner.start_run.remote_1",
    );
    // Neural Blade's next-ICE lock costs ten; its direct damage break adds
    // two when the whole path can fund it. Haunting costs twenty-eight.
    // Below forty, access can accept the explicitly quoted safe damage.
    const expectedCost = credits >= 40 ? 40 : 38;
    expect(target?.pathPassability).not.toBe("blocked_missing_coverage");
    expect(target?.pathCost).toBe(expectedCost);
    expect(target?.routeQuote?.fundingGap).toBe(
      Math.max(0, expectedCost - credits),
    );
  },
);

it("uses the exact funded remote parent rather than searching for an already installed breaker", () => {
  const { input, runtime } = checkpoint(11);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const result = chooseAiAction(input);
  expect(result).toMatchObject({
    actionId: "runner.start_run.remote_1",
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        selectedStep: {
          planInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        },
        route: {
          actionId: "runner.start_run.remote_1",
          stateVersion: input.playerView.stateVersion,
        },
      },
    },
  });
});

it("admits the exact terminal contest when the only remaining damage fits the current hand buffer", () => {
  const { input, runtime } = checkpoint(6);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const target = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  );
  expect(target).toMatchObject({
    pathPassability: "reachable",
    routeQuote: { reachability: "guaranteed_access", fundingGap: 0 },
  });
  expect(chooseAiAction(input)).toMatchObject({
    actionId: "runner.start_run.remote_1",
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        selectedStep: {
          planInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        },
        route: {
          actionId: "runner.start_run.remote_1",
          stateVersion: input.playerView.stateVersion,
        },
      },
    },
  });
});

it("does not certify damage-only access when the same known damage is lethal", () => {
  const { input } = checkpoint(6);
  input.playerView.own.gripOrHq = [];
  const target = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  );
  expect(target?.pathPassability).not.toBe("reachable");
  expect(target?.routeQuote?.reachability).toBe("no_access");
});

it("keeps actual missing coverage when the required breaker is absent", () => {
  const { input } = checkpoint(11);
  input.playerView.own.rig = (input.playerView.own.rig ?? []).filter(
    (card) => card.definitionId !== "onr_v1_039_krash",
  );
  const target = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  );
  expect(target?.pathPassability).toBe("blocked_missing_coverage");
  expect(target?.routeQuote?.reachability).toBe("no_access");
});
