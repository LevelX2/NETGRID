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
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);
function fixture(game: number, decision: number) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-554-r1-g" +
          game +
          "-d" +
          decision +
          "-empty-counter-bank.json",
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
function project(cp: ReturnType<typeof fixture>, serverId = "remote_1") {
  const input = cp.input;
  const candidate = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  }).find(
    (c) =>
      c.sourceCardInstanceId === "corp_onr_proteus_008_project-zurich_1" &&
      c.actionType === "install_card" &&
      input.legalActions.find((a) => a.actionId === c.actionId)?.payload
        ?.serverId === serverId,
  );
  expect(candidate).toBeDefined();
  return scoreProjectForCandidate(
    input,
    candidate!,
    corpScorelineFeasibilityForDecisionInput(input),
    undefined,
    false,
    false,
  )[0]!;
}
function decide(cp: ReturnType<typeof fixture>) {
  const before = JSON.stringify([cp.input.playerView, cp.input.legalActions]);
  const result = chooseAiAction(cp.input);
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  expect(JSON.stringify([cp.input.playerView, cp.input.legalActions])).toBe(
    before,
  );
  const action = cp.input.legalActions.find(
    (a) => a.actionId === result.actionId,
  )!;
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
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
}

it.each([
  [10, 301],
  [11, 230],
  [15, 180],
])("admits the native empty counter-bank fort at G%i D%i", (game, decision) => {
  const cp = fixture(game, decision);
  const bank = cp.input.playerView.servers
    .find((s) => s.id === "remote_1")!
    .root.find((c) => c.type === "asset")!;
  expect(bank.counterBankPreparationQuote?.advancementCounters).toBe(0);
  const fort = project(cp);
  expect(fort.routeAssessment).toBe("corp_forced_agenda_discard_score_attempt");
  expect(fort.feasible).toBe(true);
  expect(fort.protectionNeed?.observedAtStateVersion).toBe(
    cp.input.playerView.stateVersion,
  );
  restore(cp);
  const { action, plan } = decide(cp);
  expect(action.type).toBe("install_card");
  expect(action.payload?.serverId).toBe("remote_1");
  expect(plan.selectedPlan?.moduleId).toBe("corp.score_agenda");
});
it.each(["positive", "stale", "missing", "ordinary_hand"])(
  "does not extend relief to %s bank evidence",
  (kind) => {
    const cp = fixture(10, 301);
    const bank = cp.input.playerView.servers.find((s) => s.id === "remote_1")!
      .root[0]!;
    if (kind === "positive") {
      bank.advancementCounters = 1;
      bank.counterBankPreparationQuote!.advancementCounters = 1;
    }
    if (kind === "stale")
      bank.counterBankPreparationQuote!.expiresAtStateVersion--;
    if (kind === "missing") delete bank.counterBankPreparationQuote;
    if (kind === "ordinary_hand") cp.input.playerView.own.gripOrHq.pop();
    expect(project(cp).routeAssessment).not.toBe(
      "corp_forced_agenda_discard_score_attempt",
    );
    expect(project(cp).feasible).toBe(false);
  },
);
