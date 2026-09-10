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

describe("meta 403 free score retains exact Engine cost evidence", () => {
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
