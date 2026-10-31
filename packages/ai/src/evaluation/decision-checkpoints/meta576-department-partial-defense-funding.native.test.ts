import { readFileSync } from "node:fs";
import { beforeEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { prepareCorpDefenseDiscovery } from "../../corp/defense/defense-discovery";
import { corpFundedDefenseContinuationWindow } from "../../corp/defense/corp-funded-continuation-window";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { AiRuntimeCheckpointV1 } from "./runtime-checkpoint";
function native() {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta576-department-partial-defense-funding.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(f.validation)).toEqual(Array(9).fill(true));
  return f;
}
function windowParams(
  input: AiDecisionInputWithDeckCapabilities,
  previous: AiRuntimeCheckpointV1["residentPlanPortfolio"],
) {
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
  const { centralDefenseAllocation } = prepareCorpDefenseDiscovery({
    input,
    previous,
    candidates,
  });
  return {
    input,
    candidates,
    centralAllocation: centralDefenseAllocation,
    remoteProjects: [],
    scoreProjects: [],
  };
}
beforeEach(resetResidentPlanPortfolioMemory);
it("retains the Defense funding parent while loading a profitable two-action bank cycle below its long-term target", () => {
  const f = native(),
    input = f.input;
  expect(input.playerView.own).toMatchObject({ credits: 7, clicks: 2 });
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    f.runtime,
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    f.runtime.residentPlanPortfolio!,
  );
  const before = JSON.stringify(input),
    d = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(d.fallbackUsed).toBe(false);
  expect(d.timeoutUsed).toBe(false);
  const action = input.legalActions.find((a) => a.actionId === d.actionId)!;
  expect(action.payload?.hostedCreditAddAmount).toBe(3);
  expect(action.expiresAtStateVersion).toBe(237);
  const p = d.decisionDebug!.planFirstDecision!;
  expect(p.selectedPlan?.moduleId).toBe("corp.economy");
  expect(p.rootPlanInstanceId).toBe(
    "plan:corp.defend_servers:server-defense-portfolio",
  );
  expect(p.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: 237,
  });
  expect(p.selectedPlan?.parentNeedId).toContain("install:hq:");
});
it("does not reserve an unfunded no-progress installation but retains its genuinely funded window", () => {
  const f = native(),
    params = windowParams(f.input, f.runtime.residentPlanPortfolio);
  const low = corpFundedDefenseContinuationWindow({
    ...params,
    available: { credits: 8, clicks: 1 },
  });
  expect(low).toEqual({ actionIds: [], unknown: [] });
  const funded = corpFundedDefenseContinuationWindow({
    ...params,
    available: { credits: 32, clicks: 1 },
  });
  expect(funded.unknown).toEqual([]);
  expect(funded.actionIds).toContain(
    "corp.install_card.corp_onr_v1_278_wall-of-ice_1.hq.corp_onr_v1_278_wall-of-ice_1.5",
  );
});
it("retains a veto when the current Engine post-install quote is missing", () => {
  const f = native(),
    input = structuredClone(f.input),
    action = input.legalActions.find(
      (a) =>
        a.actionId ===
        "corp.install_card.corp_onr_v1_278_wall-of-ice_1.hq.corp_onr_v1_278_wall-of-ice_1.5",
    )!;
  delete action.payload!.postInstallRezQuoteComplete;
  const params = windowParams(input, f.runtime.residentPlanPortfolio);
  expect(
    corpFundedDefenseContinuationWindow({
      ...params,
      available: { credits: 8, clicks: 1 },
    }).unknown,
  ).toContain(action.actionId + ":current_post_install_rez_quote_unknown");
});
