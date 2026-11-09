import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { releaseAiMatchRuntime } from "./match-runtime-memory";
import type { CoverageState } from "../runner/rig-coverage/coverage-types";
import type { RunnerRemoteContestSignal } from "../plans/runner-tactical-plan-contracts";
const saved = JSON.parse(
  readFileSync(
    new URL(
      "../../../../data/scenarios/ai-decision-checkpoints/cp-deep693-coverage-current-run-credits.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  checkpoints: Array<{
    index: number;
    input: AiDecisionInputWithDeckCapabilities;
    runtime: Parameters<typeof restoreAiRuntimeCheckpoint>[2];
    validation: Record<string, boolean>;
  }>;
};
afterEach(() => releaseAiMatchRuntime(saved.checkpoints[0]!.input.matchId!));
function original(index = 98) {
  const cp = structuredClone(saved.checkpoints.find((c) => c.index === index)!);
  expect(Object.keys(cp.validation)).toHaveLength(9);
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  if (!input.ownDeckSnapshot) throw new Error("native_deck_missing");
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    structuredClone(cp.runtime.residentPlanPortfolio),
  );
  return input;
}
const install =
    "runner.install_card.runner_onr_proteus_083_corrosion_1.runner_onr_proteus_083_corrosion_1",
  root = "plan:runner.contest_remote:remote%3Aremote_1",
  executor =
    "plan:runner.rig_and_coverage:coverage%3Abreaker_wall%3Arun%3Arunner.start_run.remote_1";
function pool(input: AiDecisionInputWithDeckCapabilities) {
  const display = input.playerView.own
    .rig!.flatMap((c) => c.counterDisplays ?? [])
    .find((d) =>
      d.creditPool?.uses?.includes("using_icebreaker_during_run_non_noisy"),
    );
  if (!display?.creditPool)
    throw new Error("native_current_breaker_pool_missing");
  return display;
}
function selected(input: AiDecisionInputWithDeckCapabilities) {
  const before = JSON.stringify({
      view: input.playerView,
      actions: input.legalActions,
    }),
    result = chooseAiAction(input);
  expect(result.fallbackUsed).toBeFalsy();
  expect(result.timeoutUsed).toBeFalsy();
  expect(
    JSON.stringify({ view: input.playerView, actions: input.legalActions }),
  ).toBe(before);
  expect(
    input.legalActions.some(
      (a) =>
        a.actionId === result.actionId &&
        a.expiresAtStateVersion === input.playerView.stateVersion,
    ),
  ).toBe(true);
  return result;
}
it("installs the exact remote answer without funding a path already covered by the current compatible pool", () => {
  const input = original();
  expect(input.playerView.own.credits).toBe(6);
  expect(input.playerView.own.gripOrHq).toHaveLength(4);
  expect(pool(input).amount).toBe(2);
  const result = selected(input);
  expect(result.actionId).toBe(install);
  expect(result.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    root,
  );
  expect(result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId).toBe(
    executor,
  );
  const child = residentPlanPortfolioSnapshot(input)!.instances.find(
    (p) => p.instanceId === executor,
  )!;
  const coverage = child.moduleState as CoverageState;
  expect(coverage.kind).toBe("coverage");
  if (coverage.kind !== "coverage") throw new Error("coverage_state_missing");
  expect(coverage.gap.fundingGap).toBe(0);
  expect(coverage.gap.sameTurnRunConversion).toMatchObject({
    requiredCredits: 6,
    projectedKnownPathCost: 4,
    requiredClicksAfterFunding: 2,
    postRunCreditFloor: 1,
  });
});
it("preserves the native low-hand rejection after the old funding prefix", () => {
  const input = original(100);
  expect(input.playerView.own.gripOrHq).toHaveLength(2);
  const result = selected(input);
  expect(result.actionId).toContain(
    "runner.install_card.runner_onr_v1_040_loony-goon_1",
  );
  const parent = residentPlanPortfolioSnapshot(input)!.instances.find(
    (p) => p.instanceId === root,
  )!;
  const remote = parent.moduleState as {
    kind: "remote_contest";
    signal: RunnerRemoteContestSignal;
  };
  expect(remote.kind).toBe("remote_contest");
  if (remote.kind !== "remote_contest") throw new Error("remote_state_missing");
  expect(remote.signal.reachable).toBe(false);
  expect(remote.signal.evidenceCode).toContain(
    "runner_critical_damage_remote_contest_requires_hand_buffer",
  );
});
it("does not refill a spent recurring pool during the current turn", () => {
  const input = original();
  pool(input).amount = 0;
  const result = selected(input);
  expect(result.actionId).toContain(
    "runner.play_event.runner_onr_v1_108_score_1",
  );
  expect(result.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    root,
  );
  expect(result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId).toBe(
    executor,
  );
});
it("does not spend killer-only credits on the missing wall breaker", () => {
  const input = original();
  pool(input).creditPool!.uses = ["using_killer_during_run"];
  const result = selected(input);
  expect(result.actionId).toContain(
    "runner.play_event.runner_onr_v1_108_score_1",
  );
  expect(result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId).toBe(
    executor,
  );
});
it("retains ordinary cash funding when the restricted pool is empty", () => {
  const input = original();
  pool(input).amount = 0;
  input.playerView.own.credits = 8;
  const result = selected(input);
  expect(result.actionId).toBe(install);
  expect(result.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    root,
  );
  expect(result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId).toBe(
    executor,
  );
});
