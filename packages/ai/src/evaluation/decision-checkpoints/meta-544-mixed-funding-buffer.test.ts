import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import {
  evaluateRunnerRunTargets,
  buildRunnerEconomyPosture,
} from "../../runner-run-target-evaluation";
import { runnerRunFundingSupport } from "../../run-analysis/runner-plan-run-funding";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

afterEach(resetResidentPlanPortfolioMemory);
function native(game: number, decision: number) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-544-r5-g${game}-d${decision}-mixed-funding-buffer.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.keys(cp.validation)).toHaveLength(9);
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  return cp;
}
function funding(cp: ReturnType<typeof native>, server: string) {
  const { input } = cp;
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const params = {
    input,
    strategicIntent: input.ownRunnerStrategicIntent,
    deckCapabilities: input.ownDeckCapabilities,
    actionCandidates: candidates,
  };
  const targets = evaluateRunnerRunTargets(params);
  const target = targets.find(
    (t) => t.actionId === "runner.start_run." + server,
  )!;
  expect(target).toBeDefined();
  return {
    target,
    support: runnerRunFundingSupport(
      input,
      buildRunnerEconomyPosture(params),
      target,
      targets,
      candidates,
    ),
  };
}
function decide(cp: ReturnType<typeof native>) {
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify([cp.input.playerView, cp.input.legalActions]);
  const decision = chooseAiAction(cp.input);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  expect(JSON.stringify([cp.input.playerView, cp.input.legalActions])).toBe(
    before,
  );
  const action = cp.input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(action).toBeDefined();
  expect(action.expiresAtStateVersion).toBe(cp.input.playerView.stateVersion);
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.route?.actionId).toBe(action.actionId);
  expect(plan.route?.stateVersion).toBe(cp.input.playerView.stateVersion);
  expect(plan.route?.planInstanceId).toBe(plan.leafExecutorInstanceId);
  expect(plan.selectedStep?.planInstanceId).toBe(plan.leafExecutorInstanceId);
  return { action, plan };
}
it.each([
  [3, 33, "remote_1"],
  [15, 52, "hq"],
  [22, 161, "remote_1"],
  [22, 176, "remote_1"],
] as const)(
  "rejects ordinary funding whose credit, hand-repair and run clicks do not fit: G%i D%i",
  (game, decision, server) => {
    const cp = native(game, decision);
    const { target, support } = funding(cp, server);
    expect(target.prerunReserveQuote?.handBufferGap).toBe(1);
    expect(support?.routeActionIds ?? []).toHaveLength(0);
    const { plan } = decide(cp);
    expect(plan.leafExecutorInstanceId).not.toBe(
      "plan:runner.economy:run-support%3A" +
        (server === "hq" ? "central%3Ahq" : "remote%3Aremote_1"),
    );
  },
);
it("uses the needed hand repair without committing the last two clicks to an impossible mixed route", () => {
  const { action } = decide(native(22, 176));
  expect(action.type).toBe("draw_card");
});
it("preserves ordinary credit funding when the current hand reserve already fits", () => {
  const cp = native(7, 80);
  expect(funding(cp, "remote_1").support?.routeActionIds[0]).toBe(
    "runner.gain_credit",
  );
  expect(decide(cp).plan.leafExecutorInstanceId).toBe(
    "plan:runner.economy:run-support%3Aremote%3Aremote_1",
  );
});
it("credits Panzer Run's own net draw instead of reserving an unnecessary extra action", () => {
  const cp = native(27, 61);
  const { target, support } = funding(cp, "remote_1");
  expect(target.prerunReserveQuote?.handBufferGap).toBe(1);
  expect(support?.routeActionIds[0]).toContain("panzer-run");
  const { action, plan } = decide(cp);
  expect(action.source).toContain("panzer-run");
  expect(plan.rootPlanInstanceId).toBe(
    "plan:runner.contest_remote:remote%3Aremote_1",
  );
  expect(plan.leafExecutorInstanceId).toBe(
    "plan:runner.economy:run-support%3Aremote%3Aremote_1",
  );
});
it("preserves the exact four-click Drine, repair and bound-run sequence", () => {
  const cp = native(30, 264);
  expect(funding(cp, "remote_2").support?.routeActionIds[0]).toContain(
    "do-the-drine",
  );
  const { action, plan } = decide(cp);
  expect(action.source).toContain("do-the-drine");
  expect(plan.rootPlanInstanceId).toBe(
    "plan:runner.contest_remote:remote%3Aremote_2",
  );
  expect(plan.leafExecutorInstanceId).toBe(
    "plan:runner.economy:run-support%3Aremote%3Aremote_2",
  );
});
