import { describe, expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-free-score-d234.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { costProfileForAction } from "../../actions/action-cost-timing";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { restoreStrategicIntentMemorySnapshot } from "../../strategic-intent-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { AiRuntimeCheckpointV1 } from "./runtime-checkpoint";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { corpBasicCreditsDominatedByCurrentScore } from "../../corp/score/score-conditional-credit-funding";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";

describe("meta 403 free score retains exact Engine cost evidence", () => {
  it.each([
    "current",
    "no_click",
    "expired",
    "paid_score",
    "terminal",
    "wrong_source",
    "multiple_scores",
  ] as const)(
    "limits score-pool ordering to exact executable scope: %s",
    (variant) => {
      const input = structuredClone(
        checkpointJson.input,
      ) as unknown as AiDecisionInputWithDeckCapabilities;
      const score = input.legalActions.find((a) => a.type === "score_agenda")!;
      const project: CorpScoreProjectSignal = {
        projectId: "current-pool-score",
        agendaDefinitionId: "onr_v1_209_political-coup",
        agendaInstanceId: score.source,
        agendaPoints: 2,
        actionIds: [score.actionId],
        phase: "score_agenda",
        sameTurnCloseout: true,
        feasible: true,
        terminalScore: false,
        evidenceCode: "current_legal_score",
      };
      if (variant === "no_click") input.playerView.own.clicks = 0;
      if (variant === "expired") score.expiresAtStateVersion--;
      if (variant === "paid_score") score.costs = [{ credits: 1 }];
      if (variant === "terminal") project.terminalScore = true;
      if (variant === "wrong_source") project.agendaInstanceId = "unbound";
      if (variant === "multiple_scores")
        input.legalActions.push({ ...score, actionId: "another_score" });
      const candidates = buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "corp",
        stateVersion: input.playerView.stateVersion,
      });
      expect([
        ...corpBasicCreditsDominatedByCurrentScore(input, candidates, [
          project,
        ]),
      ]).toEqual(variant === "current" ? ["corp.gain_credit"] : []);
    },
  );
  it("admits the real free score instead of stripping its completed advancement counters", () => {
    const capture = structuredClone(checkpointJson) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    const { input, runtime } = capture;
    const score = input.legalActions.find((a) => a.type === "score_agenda")!;
    expect(score.costs).toEqual([]);
    expect(costProfileForAction(score)).toMatchObject({
      costKnownStatus: "known",
      clickCost: 0,
      creditCost: 0,
      additionalCosts: [],
    });
    resetResidentPlanPortfolioMemory();
    restoreStrategicIntentMemorySnapshot(
      input,
      runtime.strategicIntent,
      input.ownDeckSnapshot!.deckSnapshotId,
    );
    restoreResidentPlanPortfolioMemorySnapshot(
      input,
      runtime.residentPlanPortfolio,
    );
    const result = chooseAiAction(input);
    expect(result.actionId).toBe(score.actionId);
    expect(result.fallbackUsed).toBe(false);
    expect(result.decisionDebug?.planFirstDecision?.selectedPlan).toMatchObject(
      { moduleId: "corp.score_agenda", phase: "score_agenda" },
    );
    expect(
      result.decisionDebug?.planFirstDecision?.selectedStep?.stepId,
    ).toContain("score_agenda");
  });
});
