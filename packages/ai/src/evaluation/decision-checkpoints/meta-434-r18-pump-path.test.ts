import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function load(game: number, decision: number, credits?: number) {
  const { input, runtime } = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r18-g${game}-d${decision}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  if (credits !== undefined) input.playerView.own.credits = credits;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  return input;
}

it("preserves a funded outer pump when the inner damage fits the hand budget", () => {
  const input = load(20, 428);
  const pump = input.legalActions.find((a) => a.type === "pump_breaker")!;
  const result = chooseAiAction(input);
  expect(result.actionId).toBe(pump.actionId);
  expect(result).toMatchObject({
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        route: {
          actionId: pump.actionId,
          stateVersion: input.playerView.stateVersion,
        },
      },
    },
  });
  expect(
    result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toContain("plan:runner.convert_run_window:");
});

it.each([14, 15, 16])(
  "reserves the lock and ETR breaks before six pumps with %i credits",
  (credits) => {
    const input = load(15, 144, credits);
    const action = input.legalActions.find(
      (a) => a.type === (credits < 16 ? "continue_run" : "pump_breaker"),
    )!;
    const result = chooseAiAction(input);
    expect(result.actionId).toBe(action.actionId);
    expect(result.fallbackUsed).toBe(false);
    expect(
      result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    ).toContain("plan:runner.convert_run_window:");
  },
);

it("keeps the inner damage barrier when the remaining hand cannot absorb it", () => {
  const input = load(20, 428);
  input.playerView.own.gripOrHq = [];
  const result = chooseAiAction(input);
  expect(result.actionId).toBe(
    input.legalActions.find((a) => a.type === "continue_run")!.actionId,
  );
  expect(result.fallbackUsed).toBe(false);
});
