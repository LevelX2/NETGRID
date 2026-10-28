import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { createRunnerPumpFuturePathContext } from "../../runtime/runner-pump-future-path-context";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

function capture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta564-hidden-rest-path-toll.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}

afterEach(resetResidentPlanPortfolioMemory);

it("rejects the unaffordable Rasmin suffix and pumps the funded hosted breaker", () => {
  const f = capture();
  expect(Object.keys(f.validation)).toHaveLength(9);
  expect(Object.values(f.validation).every(Boolean)).toBe(true);
  const input = f.input;
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
    type: "pump_breaker",
    payload: { breakerId: "runner_onr_v1_039_krash_1" },
    expiresAtStateVersion: 301,
  });
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.selectedPlan!.moduleId).toBe("runner.convert_run_window");
  expect(plan.rootPlanInstanceId).toBe(
    "plan:runner.pressure_central:central%3Ard",
  );
  expect(plan.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: 301,
    planInstanceId: plan.leafExecutorInstanceId,
  });
  expect(plan.selectedStep!.planInstanceId).toBe(plan.leafExecutorInstanceId);
  expect(JSON.stringify(input)).toBe(before);
});

it.each([
  [0, 0, true, -1],
  [2, 2, false, 1],
  [2, 0, false, 0],
] as const)(
  "preserves actual pass fees with total %s and general %s credits",
  (credits, traceEligibleCredits, blocksPump, creditsAfterPath) => {
    const { input } = capture();
    const server = input.playerView.servers.find(
      (s: { id: string }) => s.id === "rd",
    );
    const { encounterFuturePathAfterPumpBreakAssessment: assess } =
      createRunnerPumpFuturePathContext({
        assessKnownRezzedIcePath,
        knownIcePathReason: (path) => JSON.stringify(path),
      });
    const result = assess(input, server, { credits, traceEligibleCredits }, []);
    expect(result).toMatchObject({ blocksPump, creditsAfterPath });
    expect(result.evidence.join(" ")).toContain('"assessedKnownIceCount":0');
  },
);
