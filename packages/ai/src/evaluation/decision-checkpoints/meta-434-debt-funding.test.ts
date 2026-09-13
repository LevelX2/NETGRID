import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function checkpoint() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r15-debt-funding.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}

it("funds the exact last-chance contest while preserving all ten exit credits", () => {
  const { input, runtime } = checkpoint();
  const target = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  );
  expect(target).toMatchObject({
    pathPassability: "blocked_unpayable",
    pathCost: 18,
    creditsAfterRun: -2,
    scoreThreat: true,
  });
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const result = chooseAiAction(input);
  const selected = input.legalActions.find(
    (a) => a.actionId === result.actionId,
  );
  expect(selected?.type).toBe("install_card");
  expect(selected?.source).toContain("loan-from-chiba");
  expect(result).toMatchObject({
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        selectedStep: {
          parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        },
        route: {
          actionId: result.actionId,
          stateVersion: input.playerView.stateVersion,
        },
      },
    },
  });
});

it.each([
  { credits: 15, clicks: 2 },
  { credits: 16, clicks: 1 },
])(
  "keeps debt excluded without its full exit reserve or conversion action: %j",
  ({ credits, clicks }) => {
    const { input, runtime } = checkpoint();
    input.playerView.own.credits = credits;
    input.playerView.own.clicks = clicks;
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const result = chooseAiAction(input);
    expect(
      input.legalActions.find((a) => a.actionId === result.actionId)?.source,
    ).not.toContain("loan-from-chiba");
  },
);
