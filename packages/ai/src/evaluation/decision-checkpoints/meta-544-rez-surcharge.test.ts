import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { runnerCardRunHasVisibleDifferentialPayoff } from "../../plans/runner-run-payoff";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { restoreAiRuntimeCheckpoint, type AiRuntimeCheckpointV1 } from "./runtime-checkpoint";

function fixture(game: number, decision: number) {
  return JSON.parse(readFileSync(new URL(
    "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-544-r2-g" + game + "-d" + decision + "-rez-surcharge.json", import.meta.url,
  ), "utf8")) as { input: AiDecisionInputWithDeckCapabilities; runtime: AiRuntimeCheckpointV1; validation: Record<string, boolean> };
}
function candidates(input: AiDecisionInputWithDeckCapabilities) {
  return buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    cardSemanticProfilesByDefinitionId: buildActionCardSemanticProfilesByDefinitionId(),
    visibleSourceDefinitionsByInstanceId: Object.fromEntries(input.playerView.own.gripOrHq.map(c => [c.instanceId, c.definitionId!])),
  });
}
for (const [game, index] of [[2, 259], [13, 198]] as const) {
  it("does not invent surcharge payoff on fully rezzed native G" + game + "/D" + index, () => {
    const { input, validation } = fixture(game, index);
    expect(Object.keys(validation)).toHaveLength(9);
    expect(Object.values(validation).every(Boolean)).toBe(true);
    expect(input.playerView.servers.find(s => s.id === "hq")!.ice.every(i => i.rezzed)).toBe(true);
    const event = candidates(input).find(c => c.runProjectionSummary?.serverId === "hq" && c.effectTargets?.includes("matching_printed_rez_cost_surcharge"))!;
    expect(event).toBeDefined();
    expect(event.effectTargets).toContain("matching_printed_rez_cost_surcharge");
    expect(runnerCardRunHasVisibleDifferentialPayoff(input, event, "hq")).toBe(false);
  });
  it("keeps cheaper HQ run under Central owner in native G" + game + "/D" + index, () => {
    const { input, runtime } = fixture(game, index), view = structuredClone(input.playerView), legals = structuredClone(input.legalActions);
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, runtime);
    const decision = chooseAiAction(input);
    expect(input.playerView).toEqual(view);
    expect(input.legalActions).toEqual(legals);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).toBe(false);
    expect(decision.actionId).toBe("runner.start_run.hq");
    const action = input.legalActions.find(a => a.actionId === decision.actionId)!;
    expect(action.expiresAtStateVersion).toBe(view.stateVersion);
    const plan = decision.decisionDebug?.planFirstDecision;
    expect(plan?.selectedPlan?.moduleId).toBe("runner.pressure_central");
    expect(plan?.route?.actionId).toBe(action.actionId);
    expect(plan?.route?.stateVersion).toBe(view.stateVersion);
    expect(plan?.route?.planInstanceId).toBe(plan?.leafExecutorInstanceId);
    expect(plan?.selectedStep?.planInstanceId).toBe(plan?.leafExecutorInstanceId);
  });
}
it("retains potential surcharge support on the native unrezzed Remote path", () => {
  const { input, validation } = fixture(18, 258);
  expect(Object.values(validation).every(Boolean)).toBe(true);
  expect(input.playerView.servers.find(s => s.id === "remote_1")!.ice.some(i => i.rezzed === false)).toBe(true);
  const event = candidates(input).find(c => c.runProjectionSummary?.serverId === "remote_1" && c.effectTargets?.includes("matching_printed_rez_cost_surcharge"))!;
  expect(event).toBeDefined();
  expect(runnerCardRunHasVisibleDifferentialPayoff(input, event, "remote_1")).toBe(true);
});
