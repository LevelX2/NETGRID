import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { scoreProjectForCandidate } from "../../corp/score/score-project-signals";
import { scoreRouteExposure } from "../../corp/score/score-route-risk";
import { recentlyCompromisedCorpRemoteIds } from "../../plans/corp-opponent-campaign-continuity";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { corpScorelineFeasibilityForDecisionInput } from "../../runtime/corp-scoreline-feasibility";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { restoreAiRuntimeCheckpoint, type AiRuntimeCheckpointV1 } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);
function fixture(game: number, decision: number) {
  const cp = JSON.parse(readFileSync(new URL(
    "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-544-r3-g" + game + "-d" + decision + "-score-admission.json", import.meta.url,
  ), "utf8")) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.keys(cp.validation)).toHaveLength(9);
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  return cp;
}
function projects(cp: ReturnType<typeof fixture>, previousStateVersion: number) {
  const input = cp.input;
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(input.playerView),
    cardSemanticProfilesByDefinitionId: buildActionCardSemanticProfilesByDefinitionId(),
  });
  const recent = new Set(recentlyCompromisedCorpRemoteIds(input, previousStateVersion));
  expect(recent.has("remote_1")).toBe(true);
  return candidates.filter(c => c.sourceDefinitionId === "onr_v1_206_marine-arcology" && c.actionType === "install_card")
    .flatMap(c => scoreProjectForCandidate(input, c, corpScorelineFeasibilityForDecisionInput(input), undefined, false, false, undefined, recent));
}
function decide(cp: ReturnType<typeof fixture>) {
  const before = JSON.stringify([cp.input.playerView, cp.input.legalActions]);
  const result = chooseAiAction(cp.input);
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  expect(JSON.stringify([cp.input.playerView, cp.input.legalActions])).toBe(before);
  const action = cp.input.legalActions.find(a => a.actionId === result.actionId)!;
  expect(action).toBeDefined();
  expect(action.expiresAtStateVersion).toBe(cp.input.playerView.stateVersion);
  const plan = result.decisionDebug!.planFirstDecision!;
  expect(plan.route?.actionId).toBe(action.actionId);
  expect(plan.route?.stateVersion).toBe(cp.input.playerView.stateVersion);
  expect(plan.route?.planInstanceId).toBe(plan.leafExecutorInstanceId);
  expect(plan.selectedStep?.planInstanceId).toBe(plan.leafExecutorInstanceId);
  return { result, action, plan };
}
function restore(cp: ReturnType<typeof fixture>) {
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(cp.input, cp.input.ownDeckSnapshot!.deckSnapshotId, cp.runtime);
}
it("keeps the currently quoted empty fort eligible for the same forced-discard agenda", () => {
  const previous = fixture(17, 337), cp = fixture(17, 356);
  const current = projects(cp, previous.input.playerView.stateVersion);
  const fort = current.find(p => p.serverId === "remote_1")!;
  const naked = current.find(p => p.serverId === "new_remote")!;
  expect(fort.routeAssessment).toBe("corp_forced_agenda_discard_score_attempt");
  expect(fort.feasible).toBe(true);
  expect(naked.feasible).toBe(true);
  expect(fort.protectionNeed?.parentProjectId).toBe(fort.projectId);
  expect(fort.protectionNeed?.observedAtStateVersion).toBe(cp.input.playerView.stateVersion);
  expect(scoreRouteExposure(fort, cp.input.playerView.stateVersion)).toEqual({ knowledge: "known", probability: { numerator: 1, denominator: 1 }, runnerCreditsRemaining: 9 });
  expect(scoreRouteExposure(naked, cp.input.playerView.stateVersion)).toEqual({ knowledge: "known", probability: { numerator: 1, denominator: 1 }, runnerCreditsRemaining: 15 });
});
it("chooses that fort across the real opponent-turn boundary without resetting its continuity", () => {
  const previous = fixture(17, 337), cp = fixture(17, 356);
  restore(previous);
  expect(decide(previous).action.type).toBe("end_turn");
  const { action, plan } = decide(cp);
  expect(action.type).toBe("install_card");
  expect(action.payload?.serverId).toBe("remote_1");
  expect(action.payload?.cardId).toBe("corp_onr_v1_206_marine-arcology_1");
  expect(plan.selectedPlan?.moduleId).toBe("corp.score_agenda");
  expect(plan.rootPlanInstanceId).toBe(plan.selectedPlan?.instanceId);
});
it("still requires reprotection outside the exact forced-discard exception", () => {
  const previous = fixture(3, 209), cp = fixture(3, 245);
  expect(cp.input.playerView.own.gripOrHq.length).toBeLessThanOrEqual(cp.input.playerView.own.maxHandSize);
  const fort = projects(cp, previous.input.playerView.stateVersion).find(p => p.serverId === "remote_1")!;
  expect(fort.feasible).toBe(false);
  expect(fort.routeAssessment).toBe("corp_recently_compromised_score_remote_requires_reprotection");
  restore(previous);
  expect(decide(previous).action.type).toBe("end_turn");
  expect(decide(cp).action.type).toBe("gain_credit");
});
it("preserves the native funded terminal-defense reserve before a nonterminal score", () => {
  const cp = fixture(22, 322);
  restore(cp);
  const { action, plan } = decide(cp);
  expect(action.type).toBe("draw_card");
  expect(plan.selectedPlan?.moduleId).toBe("corp.defend_servers");
  expect(plan.portfolio.some(p => p.moduleId === "corp.score_agenda" && p.viability === "blocked" && p.evidenceCodes.some(e => e.startsWith("corp_same_turn_score_consumes_funded_defense_reserve:")))).toBe(true);
});
it("keeps the native immediate winning install available with zero liquid credits", () => {
  const cp = fixture(33, 330);
  expect(cp.input.playerView.own.credits).toBe(0);
  restore(cp);
  const { action, plan } = decide(cp);
  expect(action.type).toBe("install_card");
  expect(action.payload?.serverId).toBe("new_remote");
  expect(action.payload?.cardId).toBe("corp_onr_proteus_008_project-zurich_1");
  expect(plan.selectedPlan?.moduleId).toBe("corp.score_agenda");
  expect(plan.priority?.effectiveClass).toBe("P1");
});
