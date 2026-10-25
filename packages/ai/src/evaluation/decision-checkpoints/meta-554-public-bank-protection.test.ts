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
function fixture() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-554-r2-g31-d218-broker-protection.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  expect(Object.keys(cp.validation)).toHaveLength(9);
  return cp;
}
function project(
  cp: ReturnType<typeof fixture>,
  deadline?: "last_draw_window" | "current_turn_only",
) {
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
      c.sourceDefinitionId === "onr_v1_203_hostile-takeover" &&
      input.legalActions.find((a) => a.actionId === c.actionId)?.payload
        ?.serverId === "remote_1",
  )!;
  const feasibility = corpScorelineFeasibilityForDecisionInput(input);
  if (!feasibility) throw Error("Native scoreline feasibility missing");
  return scoreProjectForCandidate(
    input,
    candidate,
    deadline ? { ...feasibility, deadline } : feasibility,
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

it("counts the native public bank cashout before certifying a matchpoint fort", () => {
  const cp = fixture(),
    p = project(cp);
  expect(cp.input.playerView.opponent.credits).toBe(2);
  expect(cp.input.playerView.runnerNextTurnCreditClicks).toBe(3);
  expect(p.protectionNeed?.baseline.knowledge).toBe("known");
  if (p.protectionNeed?.baseline.knowledge !== "known")
    throw Error("Expected known public protection");
  expect(
    p.protectionNeed.baseline.protection.runnerAccessSuccessProbability,
  ).toEqual({ numerator: 1, denominator: 1 });
  expect(p.feasible).toBe(false);
  restore(cp);
  const { action, plan } = decide(cp);
  expect(action.type).toBe("install_card");
  expect(action.payload?.cardId).toBe("corp_onr_v1_244_filter_3");
  expect(action.payload?.serverId).toBe("remote_1");
  expect(plan.selectedPlan?.moduleId).toBe("corp.defend_servers");
});
it("preserves the same native score admission with an empty public bank", () => {
  const cp = fixture();
  const bank = cp.input.playerView.opponent.rig!.find(
    (c) => c.definitionId === "onr_v1_154_broker",
  )!;
  bank.counters = { bit: 0 };
  bank.counterDisplays = [];
  const p = project(cp);
  expect(p.feasible).toBe(true);
  expect(p.protectionNeed?.baseline.knowledge).toBe("known");
  if (p.protectionNeed?.baseline.knowledge !== "known")
    throw Error("Expected known protection");
  expect(
    p.protectionNeed.baseline.protection.runnerAccessSuccessProbability,
  ).toEqual({ numerator: 0, denominator: 1 });
});

it.each(["last_draw_window", "current_turn_only"] as const)(
  "retains the hard current-turn reserve for real %s completion deadlines",
  (deadline) => {
    const cp = fixture(),
      p = project(cp, deadline);
    expect(p.protectionNeed?.scoreReserve.hardClickReserve).toBe(4);
    expect(p.feasible).toBe(false);
  },
);
