import { expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-two-click-score-order-d157.json";
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

it("keeps both remaining credits after the exact free score instead of erasing the first", () => {
  const { input, runtime } = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  expect(input.playerView.own).toMatchObject({
    credits: 3,
    clicks: 2,
    agendaPoints: 1,
  });
  expect(
    input.legalActions.some((a) => a.actionId === "corp.gain_credit"),
  ).toBe(true);
  const score = input.legalActions.find((a) => a.type === "score_agenda")!;
  expect(score.costs).toEqual([]);
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
  expect(
    decision.decisionDebug!.planFirstDecision!.selectedPlan?.instanceId,
  ).toBe(root.instanceId);
  expect(
    decision.decisionDebug!.planFirstDecision!.selectedStep?.planInstanceId,
  ).toBe(root.instanceId);
});

it.each([
  "bounded",
  "reachable_by_two_credits",
  "third_click",
  "hand_operation",
  "recovery_only",
  "advance_only",
  "unrezzed_income",
  "scored_payout",
  "other_agenda",
  "unknown_card",
  "live_run",
] as const)("requires a closed two-click score-order proof: %s", (variant) => {
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
  if (variant === "reachable_by_two_credits") input.playerView.own.credits = 10;
  if (variant === "third_click") input.playerView.own.clicks = 3;
  if (variant === "hand_operation") {
    const card = input.playerView.own.gripOrHq[0]!;
    card.type = "operation";
    card.definitionId = "onr_v1_295_night-shift";
  }
  if (variant === "recovery_only" || variant === "advance_only") {
    const card = input.playerView.own.gripOrHq[0]!;
    card.type = "operation";
    card.definitionId =
      variant === "recovery_only"
        ? "onr_v1_296_off-site-backups"
        : "onr_v1_300_project-consultants";
  }
  const otherRoot = input.playerView.servers.find((s) => s.id === "hq")!
    .root[0]!;
  if (variant === "unrezzed_income") {
    otherRoot.type = "asset";
    otherRoot.definitionId = "onr_v1_309_bbs-whispering-campaign";
  }
  if (variant === "scored_payout")
    input.playerView.own.scoreArea[0]!.definitionId =
      "onr_v1_209_political-coup";
  if (variant === "other_agenda") {
    otherRoot.type = "agenda";
    otherRoot.definitionId = "onr_v1_203_hostile-takeover";
    otherRoot.advancementCounters = 2;
  }
  if (variant === "unknown_card")
    otherRoot.definitionId = "unmapped-test-definition";
  if (variant === "live_run")
    input.playerView.run = {
      runId: "live",
      attackedServerId: "hq",
      phase: "movement",
      successful: false,
    };
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
  });
  expect([
    ...corpBasicCreditsDominatedByCurrentScore(input, candidates, [project]),
  ]).toEqual(
    ["bounded", "recovery_only", "advance_only"].includes(variant)
      ? ["corp.gain_credit"]
      : [],
  );
});
