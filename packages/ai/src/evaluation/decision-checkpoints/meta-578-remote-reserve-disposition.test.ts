import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";

afterEach(resetResidentPlanPortfolioMemory);
it("classifies the reserve-blocked native Remote run while retaining tag recovery", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta578-r2-g27-unowned-remote.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify(cp.input);
  const result = chooseAiAction(cp.input);
  expect(JSON.stringify(cp.input)).toBe(before);
  expect(result).toMatchObject({
    actionId: "runner.remove_tag",
    fallbackUsed: false,
    timeoutUsed: false,
  });
  const plan = result.decisionDebug!.planFirstDecision!;
  expect(plan.rootPlanInstanceId).toMatch(
    /^plan:runner\.defense_and_recovery:/,
  );
  expect(plan.route).toMatchObject({
    actionId: result.actionId,
    stateVersion: 14,
  });
  expect(plan.turnPlanning?.coverage).toMatchObject({
    status: "pass",
    coveragePercent: 100,
  });
});

it("does not retain the reserve rejection once the current grip is buffered", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta578-r2-g27-unowned-remote.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  cp.input.playerView.own.gripOrHq.push({
    ...cp.input.playerView.own.gripOrHq[0],
    instanceId: "owned-buffer-countercase",
  });
  const remote = evaluateRunnerRunTargets({ input: cp.input }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  )!;
  expect(remote.prerunReserveQuote?.status).not.toBe("blocked");
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const result = chooseAiAction(cp.input);
  expect(result).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  expect(
    result.decisionDebug?.planFirstDecision?.turnPlanning?.coverage,
  ).toMatchObject({ status: "pass", coveragePercent: 100 });
  const alternative = result.decisionDebug?.actionAlternatives?.find(
    (a) => a.actionId === remote.actionId,
  );
  expect(alternative).toBeDefined();
  expect(alternative?.whyNot).not.toContain(
    "runner_remote_run_prerun_reserve_blocked:remote_1",
  );
});
