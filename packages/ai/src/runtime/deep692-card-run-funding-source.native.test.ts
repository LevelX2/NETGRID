import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { releaseAiMatchRuntime } from "./match-runtime-memory";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { evaluateRunnerRunTargets } from "../runner-run-target-evaluation";
import { runnerExactFundingRouteContract } from "./runner-exact-funding-routes";

const saved = JSON.parse(
  readFileSync(
    new URL(
      "../../../../data/scenarios/ai-decision-checkpoints/cp-deep692-card-run-funding-source.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  checkpoint: {
    source: { root: string; executor: string };
    input: AiDecisionInputWithDeckCapabilities;
    runtime: Parameters<typeof restoreAiRuntimeCheckpoint>[2];
  };
};
afterEach(() => releaseAiMatchRuntime(saved.checkpoint.input.matchId!));
function original() {
  const cp = structuredClone(saved.checkpoint),
    input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
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
function funding(
  cardRun: boolean,
  allowStrategicExchange = true,
  targetCredits = 9,
  remainingClicks = 1,
) {
  const input = original(),
    actionId = cardRun
      ? "runner.play_event.runner_onr_classic_039_library-search_1.rd.runner_onr_classic_039_library-search_1"
      : "runner.start_run.rd";
  const target = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === actionId,
  );
  if (!target) throw new Error("native_target_missing");
  return runnerExactFundingRouteContract(
    input,
    buildActionSemanticCandidates({ legalActions: input.legalActions }),
    {
      demandId: "run-support:central:rd",
      sourcePlanId: saved.checkpoint.source.root,
      purpose: "current_run",
      priority: "current_foreground_plan",
      hardness: "hard",
      deadline: "end_of_current_turn",
      targetCredits,
      remainingClicks,
      allowStrategicExchange,
      paymentWindowTarget: target,
    },
  );
}
it("does not fund Library Search by randomly discarding the event required by that same parent", () => {
  const input = original(),
    before = JSON.stringify({
      view: input.playerView,
      actions: input.legalActions,
    }),
    decision = chooseAiAction(input),
    action = input.legalActions.find((a) => a.actionId === decision.actionId);
  expect(action).toBeDefined();
  expect(action!.expiresAtStateVersion).toBe(input.playerView.stateVersion);
  expect(action!.payload?.damageAmount).toBeUndefined();
  expect(action!.actionId).toBe("runner.gain_credit");
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:runner.economy:runner-portfolio-credit-reserve",
  );
  expect(
    decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toBe("plan:runner.economy:runner-portfolio-credit-reserve");
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
    actionId: decision.actionId,
    stateVersion: input.playerView.stateVersion,
  });
  expect(
    JSON.stringify({ view: input.playerView, actions: input.legalActions }) ===
      before,
  ).toBe(true);
});
it("does not certify any random-self-damage funding route for the exact grip-backed consumer", () => {
  const route = funding(true);
  expect(route.routeActionIds).toEqual([]);
  expect(route.routeAssessment.evidenceCodes).toEqual(
    expect.arrayContaining([
      expect.stringContaining(
        "runner_funding_consumer_grip_source_not_preserved:",
      ),
    ]),
  );
});
it("retains the original funded basic run when its zero hand buffer needs no grip source", () => {
  expect(funding(false).routeActionIds[0]).toContain("do-the-drine");
  expect(funding(false).routeAssessment.status).toBe("covered_guaranteed");
});
it("keeps ordinary credit funding for the same event when its hand source survives", () => {
  const route = funding(true, false, 7, 2);
  expect(route.routeActionIds).toEqual(["runner.gain_credit"]);
  expect(route.routeAssessment.status).toBe("covered_guaranteed");
});
