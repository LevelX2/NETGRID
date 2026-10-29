import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { withCorpCounterBankReplacementPreparation } from "../../corp/score/score-counter-bank-replacement";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { readFileSync } from "node:fs";
import { beforeEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
function fixture(kind: string) {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta567-counter-bank-" +
          kind +
          ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.keys(f.validation)).toHaveLength(9);
  expect(Object.values(f.validation).every(Boolean)).toBe(true);
  return f;
}
beforeEach(resetResidentPlanPortfolioMemory);
it.each(["unrezzed-replacement", "rezzed-replacement"])(
  "preserves free counter liquidity before %s under the same agenda parent",
  (kind) => {
    const f = fixture(kind),
      input = f.input;
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot.deckSnapshotId,
      f.runtime,
    );
    const before = JSON.stringify(input),
      result = chooseAiAction(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(result.fallbackUsed).toBe(false);
    expect(result.timeoutUsed).toBe(false);
    const action = input.legalActions.find(
      (a: any) => a.actionId === result.actionId,
    );
    expect(action).toBeDefined();
    expect(action.type).toBe(
      kind === "unrezzed-replacement" ? "rez_card" : "activated_card_ability",
    );
    expect(action.source).toBe("corp_onr_v1_347_vapor-ops_1");
    expect(
      action.costs.every(
        (c: any) => (c.clicks ?? 0) === 0 && (c.credits ?? 0) === 0,
      ),
    ).toBe(true);
    const plan = result.decisionDebug!.planFirstDecision!;
    expect(plan.selectedPlan!.moduleId).toBe("corp.score_agenda");
    expect(plan.rootPlanInstanceId).toBe(
      "plan:corp.score_agenda:agenda%3Acorp_onr_v1_220_tycho-extension_" +
        (kind === "unrezzed-replacement" ? "1" : "2") +
        "%3Aremote_1",
    );
    expect(plan.route!.actionId).toBe(action.actionId);
    expect(plan.route!.stateVersion).toBe(input.playerView.stateVersion);
    expect(plan.route!.planInstanceId).toBe(plan.leafExecutorInstanceId);
  },
);
it("keeps the actual funded counter transfer preparation", () => {
  const f = fixture("handoff-rez"),
    input = f.input;
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    f.runtime,
  );
  const result = chooseAiAction(input);
  expect(result.actionId).toBe(
    "corp.rez_card.corp_onr_v1_347_vapor-ops_1.remote_1.corp_onr_v1_347_vapor-ops_1",
  );
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  expect(result.decisionDebug!.planFirstDecision!.selectedPlan!.moduleId).toBe(
    "corp.score_agenda",
  );
});

it.each([
  "current",
  "stale_quote",
  "empty",
  "paid_rez",
  "click_rez",
  "foreign_cost",
  "missing_rez",
  "different_remote",
  "not_admitted",
  "funding_gap",
  "instant_win",
])("bounds replacement preparation: %s", (change) => {
  const input = fixture("unrezzed-replacement").input;
  const install = input.legalActions.find(
    (a: any) =>
      a.type === "install_card" &&
      a.source === "corp_onr_v1_220_tycho-extension_1" &&
      a.payload?.serverId === "remote_1",
  );
  const bank = input.playerView.servers.find((s: any) => s.id === "remote_1")
    .root[0];
  const rez = input.legalActions.find(
    (a: any) => a.type === "rez_card" && a.source === bank.instanceId,
  );
  const project: CorpScoreProjectSignal = {
    projectId: "agenda:" + install.source + ":remote_1",
    agendaInstanceId: install.source,
    agendaPoints: 4,
    serverId: "remote_1",
    phase: "install_agenda",
    actionIds: [install.actionId],
    feasible: true,
    terminalScore: true,
    sameTurnCloseout: false,
    evidenceCode: "native_admitted_install",
  };
  if (change === "stale_quote")
    bank.counterBankPreparationQuote.expiresAtStateVersion--;
  if (change === "empty")
    bank.counterBankPreparationQuote.advancementCounters =
      bank.advancementCounters = 0;
  if (change === "paid_rez") rez.costs = [{ credits: 1 }];
  if (change === "click_rez") rez.costs = [{ clicks: 1 }];
  if (change === "foreign_cost") rez.costs = [{ agendaPoints: 1 }];
  if (change === "missing_rez")
    input.legalActions = input.legalActions.filter(
      (a: any) => a.actionId !== rez.actionId,
    );
  if (change === "different_remote") project.serverId = "remote_2";
  if (change === "not_admitted") project.feasible = false;
  if (change === "funding_gap") project.fundingGap = 1;
  if (change === "instant_win") project.sameTurnCloseout = true;
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
  const before = JSON.stringify([input, project]);
  const result = withCorpCounterBankReplacementPreparation(
    input,
    candidates,
    project,
  );
  expect(JSON.stringify([input, project])).toBe(before);
  if (change === "current") {
    expect(result.projectId).toBe(project.projectId);
    expect(result.actionIds).toEqual([rez.actionId]);
    expect(result.counterBankReplacement?.installActionId).toBe(
      install.actionId,
    );
  } else expect(result).toBe(project);
});
