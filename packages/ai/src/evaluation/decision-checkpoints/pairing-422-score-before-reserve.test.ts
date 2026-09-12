import { expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-score-before-reserve-d189.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { corpBasicCreditsDominatedByCurrentScore } from "../../corp/score/score-conditional-credit-funding";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";

it("scores before the last basic reserve credit that the free score would erase", () => {
  const { input, runtime } = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  expect(input.playerView.own).toMatchObject({
    credits: 6,
    clicks: 1,
    agendaPoints: 0,
  });
  const score = input.legalActions.find(
    (action) => action.type === "score_agenda",
  )!;
  expect(score.costs).toEqual([]);
  expect(
    input.legalActions.find((action) => action.actionId === "corp.gain_credit"),
  ).toMatchObject({
    costs: [{ clicks: 1 }],
    payload: { gainCreditsAmount: 1 },
  });
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(score.actionId);
  expect(decision.fallbackUsed).toBe(false);
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const root = portfolio.instances.find(
    (p) => p.instanceId === portfolio.rootForegroundInstanceId,
  )!;
  expect(root.moduleId).toBe("corp.score_agenda");
  const selected = decision.decisionDebug!.planFirstDecision!;
  expect(selected.selectedPlan).toMatchObject({
    moduleId: "corp.score_agenda",
    instanceId: root.instanceId,
  });
  expect(selected.selectedStep).toMatchObject({
    planInstanceId: root.instanceId,
  });
});

it.each([
  "last_credit",
  "reachable_threshold",
  "more_clicks",
  "terminal_score",
  "expired_score",
  "ordinary_agenda",
  "free_income",
] as const)("limits score ordering dominance: %s", (variant) => {
  const input = structuredClone(
    checkpointJson.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const score = input.legalActions.find((a) => a.type === "score_agenda")!;
  const project: CorpScoreProjectSignal = {
    projectId: "current-score",
    agendaDefinitionId: "onr_v1_196_corporate-war",
    agendaInstanceId: score.source,
    agendaPoints: 3,
    phase: "score_agenda",
    actionIds: [score.actionId],
    sameTurnCloseout: true,
    feasible: true,
    terminalScore: false,
    evidenceCode: "current_legal_score",
  };
  if (variant === "reachable_threshold") input.playerView.own.credits = 11;
  if (variant === "more_clicks") input.playerView.own.clicks = 2;
  if (variant === "terminal_score") project.terminalScore = true;
  if (variant === "expired_score") score.expiresAtStateVersion--;
  if (variant === "ordinary_agenda")
    project.agendaDefinitionId = "onr_v1_203_hostile-takeover";
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
  });
  if (variant === "free_income") {
    const credit = structuredClone(
      input.legalActions.find((a) => a.type === "gain_credit")!,
    );
    credit.actionId = "quoted_free_income";
    credit.costs = [];
    input.legalActions.push(credit);
    const candidate = structuredClone(
      candidates.find((a) => a.actionType === "gain_credit")!,
    );
    candidate.actionId = credit.actionId;
    candidates.push(candidate);
  }
  expect([
    ...corpBasicCreditsDominatedByCurrentScore(input, candidates, [project]),
  ]).toEqual(variant === "last_credit" ? ["corp.gain_credit"] : []);
});
