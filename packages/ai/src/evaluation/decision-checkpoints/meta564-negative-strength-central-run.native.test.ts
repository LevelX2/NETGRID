import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { creditsToBreakEndTheRunSubroutinesWithBreaker } from "../../run-analysis/visible-run-breaker-path";
import { runnerRunPathCreditBudgetWithVisiblePools } from "../../run-analysis/visible-run-credit-budget";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

function capture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta564-negative-strength-central-run.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}

afterEach(resetResidentPlanPortfolioMemory);

it.each([
  [-2, 8],
  [-1, 6],
  [0, 4],
  [1, 2],
])(
  "quotes the entire pump deficit from signed strength %s",
  (strength, cost) => {
    const { input } = capture();
    const breaker = input.playerView.own.rig.find(
      (c: { definitionId: string }) => c.definitionId === "onr_v1_039_krash",
    );
    const ice = input.playerView.servers.find(
      (s: { id: string }) => s.id === "rd",
    ).ice[0];
    breaker.strength = strength;
    const before = JSON.stringify(breaker);
    expect(
      creditsToBreakEndTheRunSubroutinesWithBreaker(breaker, ice, 1),
    ).toMatchObject({ cost, endingStrength: 1 });
    expect(JSON.stringify(breaker)).toBe(before);
  },
);

it("funds the native negative-strength route before starting another known failed run", () => {
  const f = capture();
  expect(Object.keys(f.validation)).toHaveLength(9);
  expect(Object.values(f.validation).every(Boolean)).toBe(true);
  const input = f.input;
  const server = input.playerView.servers.find(
    (s: { id: string }) => s.id === "rd",
  );
  const budget = runnerRunPathCreditBudgetWithVisiblePools(
    input.playerView.own.credits,
    input.playerView.own.rig,
  );
  expect(budget).toMatchObject({ credits: 0, nonNoisyIcebreakerCredits: 5 });
  const path = assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig,
    budget,
  );
  expect(path.canReachAccess).toBe(false);

  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    f.runtime,
  );
  const before = JSON.stringify(input);
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (a: { actionId: string }) => a.actionId === decision.actionId,
  );
  expect(action).toMatchObject({
    type: "play_event",
    source: "runner_onr_proteus_124_stakeout_2",
    expiresAtStateVersion: 328,
  });
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.selectedPlan!.moduleId).toBe("runner.economy");
  expect(plan.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: 328,
    planInstanceId: plan.leafExecutorInstanceId,
  });
  expect(plan.selectedStep!.planInstanceId).toBe(plan.leafExecutorInstanceId);
  expect(JSON.stringify(input)).toBe(before);
});
