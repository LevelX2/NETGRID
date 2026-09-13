import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function checkpoint(name = "debt-full-path") {
  return JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r17-${name}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}

it("does not certify a debt exit from the first unaffordable ICE instead of the complete route", () => {
  const { input, runtime } = checkpoint();
  const before = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  )!;
  expect(before).toMatchObject({
    pathCost: 8,
    pathPassability: "blocked_unpayable",
  });
  const funded = structuredClone(input);
  funded.playerView.own.credits = 20;
  const wholePath = evaluateRunnerRunTargets({ input: funded }).find(
    (t) => t.actionId === before.actionId,
  )!;
  expect(wholePath).toMatchObject({
    pathCost: 20,
    creditsAfterRun: 0,
    pathPassability: "reachable",
  });
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const result = chooseAiAction(input);
  const selected = input.legalActions.find(
    (a) => a.actionId === result.actionId,
  )!;
  expect(selected).toBeDefined();
  expect(selected.source).not.toContain("loan-from-chiba");
  expect(result.fallbackUsed).toBe(false);
  expect(result.decisionDebug?.planFirstDecision?.route).toMatchObject({
    actionId: result.actionId,
    stateVersion: input.playerView.stateVersion,
  });
});

it("includes the remaining subroutines even when the unfunded path already reached the last ICE", () => {
  const { input, runtime } = checkpoint("debt-last-ice");
  const before = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.remote_2",
  )!;
  expect(before).toMatchObject({ pathCost: 26, creditsAfterRun: -2 });
  const funded = structuredClone(input);
  funded.playerView.own.credits += 12;
  const wholePath = evaluateRunnerRunTargets({ input: funded }).find(
    (t) => t.actionId === before.actionId,
  )!;
  expect(wholePath).toMatchObject({
    pathCost: 30,
    creditsAfterRun: 6,
    pathPassability: "reachable",
  });
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const result = chooseAiAction(input);
  expect(
    input.legalActions.find((a) => a.actionId === result.actionId)?.source,
  ).not.toContain("loan-from-chiba");
  expect(result.fallbackUsed).toBe(false);
});
