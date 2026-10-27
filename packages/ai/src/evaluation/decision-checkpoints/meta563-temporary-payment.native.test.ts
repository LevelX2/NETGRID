import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { resolvePlanBoundRunnerCostPenaltyContinuation } from "../../runner/run-window/run-window-cost-continuation";
function original() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta563-temporary-encounter-payment-original.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
beforeEach(resetResidentPlanPortfolioMemory);
describe("native temporary-encounter payment origin", () => {
  it("keeps the original Run owner through the revealed Corp intervention (SP-687)", () => {
    const f = original(),
      input = f.input,
      pending = structuredClone(
        f.runtime.residentPlanPortfolio.pendingRunnerCostPenaltySupportOrigin,
      );
    expect(Object.values(f.validation).every((x) => x === true)).toBe(true);
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot.deckSnapshotId,
      f.runtime,
    );
    const before = JSON.stringify(input),
      decision = chooseAiAction(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(decision.actionId).toBe(pending.originalActionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).toBe(false);
    const debug = decision.decisionDebug!.planFirstDecision!;
    expect(debug.rootPlanInstanceId).toBe(pending.rootPlanInstanceId);
    expect(debug.leafExecutorInstanceId).toBe(pending.executorInstanceId);
    expect(
      residentPlanPortfolioSnapshot(input)!
        .pendingRunnerCostPenaltySupportOrigin,
    ).toBeUndefined();
  });
  it.each([
    "gap",
    "wrong_source",
    "wrong_ability",
    "missing_intervention",
    "wrong_reveal",
    "wrong_server",
    "intervening_runner",
    "wrong_run",
    "wrong_root",
    "stale_selection",
  ])("fails closed for %s", (change) => {
    const f = original(),
      input = f.input,
      prior = f.runtime.residentPlanPortfolio,
      events = input.eventTail;
    const first = events.find((e: any) => e.stateVersionBefore === 100),
      last = events.at(-1);
    if (change === "gap") events.splice(events.indexOf(first), 1);
    if (change === "wrong_source")
      last.publicPayload.sourceDefinitionId = "another-source";
    if (change === "wrong_ability")
      last.publicPayload.abilityId = "another-ability";
    if (change === "missing_intervention")
      delete first.publicPayload.hiddenZoneAction;
    if (change === "wrong_reveal")
      last.publicPayload.cardDefinitionId = "another-ice";
    if (change === "wrong_server") last.publicPayload.serverId = "rd";
    if (change === "intervening_runner") last.publicPayload.actor = "runner";
    if (change === "wrong_run") input.playerView.run.runId = "other-run";
    if (change === "wrong_root") prior.rootForegroundInstanceId = "other-root";
    if (change === "stale_selection")
      prior.pendingRunnerCostPenaltySupportOrigin.selectedAtStateVersion--;
    expect(() =>
      resolvePlanBoundRunnerCostPenaltyContinuation(
        { input, actionCandidates: [], turnKey: "runner:turn:13" },
        prior,
      ),
    ).toThrow(/window_origin_missing/);
  });
});
