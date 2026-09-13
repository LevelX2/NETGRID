import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

function input() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r16-paid-damage-breaks.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ).input as AiDecisionInputWithDeckCapabilities;
}

it("does not count damage whose breaks the visible path has already paid", () => {
  const current = input();
  // Funding counterfactual on the unchanged historical visible board:
  // 14 credits of strength plus eight breaks at two credits each.
  current.playerView.own.credits = 30;
  const target = evaluateRunnerRunTargets({ input: current }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  )!;
  expect(target.pathCost).toBe(30);
  expect(target.pathPassability).toBe("reachable");
  expect(
    target.evidence.some((e) =>
      e.startsWith("runner_visible_lethal_ice_damage"),
    ),
  ).toBe(false);
});

it("keeps an actually unfunded known path blocked", () => {
  const current = input();
  const target = evaluateRunnerRunTargets({ input: current }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  )!;
  expect(target.pathPassability).not.toBe("reachable");
});

it("still counts the exact damage left after only two paid damage breaks", () => {
  const current = input();
  current.playerView.own.credits = 27;
  const target = evaluateRunnerRunTargets({ input: current }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  )!;
  expect(target.pathCost).toBe(26);
  expect(target.pathPassability).toBe("blocked_by_visible_damage_hand_buffer");
  expect(target.evidence).toEqual(
    expect.arrayContaining([expect.stringContaining("cumulative_damage:4")]),
  );
});

it("keeps the funded legal run bound to the existing contest owner and step", () => {
  const capture = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r16-paid-damage-breaks.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const current = capture.input as AiDecisionInputWithDeckCapabilities;
  current.playerView.own.credits = 40;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    current,
    current.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  const result = chooseAiAction(current);
  expect(result.actionId).toBe("runner.start_run.remote_1");
  expect(current.legalActions.some((a) => a.actionId === result.actionId)).toBe(
    true,
  );
  expect(result.fallbackUsed).toBe(false);
  const debug = result.decisionDebug!.planFirstDecision!;
  expect(debug.selectedPlan!.moduleId).toBe("runner.contest_remote");
  expect(debug.selectedStep!.planInstanceId).toBe(
    debug.selectedPlan!.instanceId,
  );
  expect(debug.selectedStep!.stepId).toBe(
    `${debug.selectedPlan!.instanceId}:contest`,
  );
});

it("does not invent damage breaks when the matching breaker is absent", () => {
  const current = input();
  current.playerView.own.credits = 30;
  current.playerView.own.rig = current.playerView.own.rig!.filter(
    (c) => c.type !== "program",
  );
  const target = evaluateRunnerRunTargets({ input: current }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  )!;
  expect(target.pathPassability).not.toBe("reachable");
});
