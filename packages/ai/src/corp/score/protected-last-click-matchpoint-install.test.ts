import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { scoreProjectForCandidate } from "./score-project-signals";

const actionId =
  "corp.install_card.corp_onr_classic_002_superserum_1.remote_1.corp_onr_classic_002_superserum_1";
const parent =
  "plan:corp.score_agenda:agenda%3Acorp_onr_classic_002_superserum_1%3Aremote_1";

function fixture() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-475-r2-g20-d355.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation).every((v) => v === true)).toBe(true);
  const input: AiDecisionInputWithDeckCapabilities = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  };
  return { cp, input };
}

function project(input: AiDecisionInputWithDeckCapabilities, id = actionId) {
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
  const candidate = candidates.find((c) => c.actionId === id)!;
  return scoreProjectForCandidate(
    input,
    candidate,
    undefined,
    undefined,
    false,
    false,
  )[0]!;
}

afterEach(resetResidentPlanPortfolioMemory);

it("admits a funded protected next-turn matchpoint install on the last click under its exact Score owner", () => {
  const { cp, input } = fixture();
  expect(input.playerView.own).toMatchObject({
    credits: 5,
    clicks: 1,
    agendaPoints: 5,
    stackOrRdCount: 7,
  });
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  const signal = project(input);
  expect(signal.protectionNeed?.baseline).toMatchObject({
    knowledge: "known",
    fundedProtection: true,
    totalSelectedAgendaPointCost: 0,
    protection: {
      runnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
    },
  });
  expect(signal.feasible).toBe(true);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const result = chooseAiAction(input);
  expect(result.actionId).toBe(actionId);
  expect(result.fallbackUsed).toBe(false);
  const pf = result.decisionDebug?.planFirstDecision;
  expect(pf?.rootPlanInstanceId).toBe(parent);
  expect(pf?.leafExecutorInstanceId).toBe(parent);
  expect(pf?.route).toMatchObject({
    actionId,
    stateVersion: input.playerView.stateVersion,
  });
  expect(pf?.route?.stepId).toContain(parent);
  expect(
    residentPlanPortfolioSnapshot(input)?.instances.find(
      (i) => i.instanceId === parent,
    )?.moduleState,
  ).toMatchObject({
    signal: {
      terminalScore: true,
      feasible: true,
      routeAssessment: "corp_engine_certified_mature_remote_score_install",
    },
  });
});

it("does not claim matchpoint after the protection route consumes an agenda point", () => {
  const { input } = fixture();
  const signal = project(input, actionId.replace("remote_1", "remote_2"));
  expect(signal.protectionNeed?.baseline).toMatchObject({
    knowledge: "known",
    fundedProtection: true,
    agendaPointsAfterDefense: 4,
    totalSelectedAgendaPointCost: 1,
  });
  expect(signal).toMatchObject({
    feasible: false,
    routeAssessment: "corp_last_click_score_install_deferred",
  });
});

it.each([
  "unfunded",
  "not_matchpoint",
  "unknown_horizon",
  "stale_horizon",
  "insufficient_horizon",
  "unprotected",
])("retains the last-click guard for %s", (kind) => {
  const { input } = fixture();
  const payload = input.legalActions.find(
    (a) => a.actionId === actionId,
  )!.payload!;
  if (kind === "unfunded") input.playerView.own.credits = 2;
  if (kind === "not_matchpoint") input.playerView.own.agendaPoints = 4;
  if (kind === "unknown_horizon")
    payload.agendaInstallScoreHorizonQuoteComplete = false;
  if (kind === "stale_horizon")
    payload.agendaInstallScoreHorizonQuoteExpiresAtStateVersion =
      input.playerView.stateVersion - 1;
  if (kind === "insufficient_horizon")
    payload.agendaInstallScoreHorizonQuoteNextCorpTurnGuaranteedFlexibleClicks = 2;
  if (kind === "unprotected")
    input.playerView.servers.find((s) => s.id === "remote_1")!.ice = [];
  expect(project(input)).toMatchObject({
    feasible: false,
    routeAssessment: "corp_last_click_score_install_deferred",
  });
});
