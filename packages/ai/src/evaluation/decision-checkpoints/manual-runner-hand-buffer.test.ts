import fixture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manual-20261108-runner-hand-buffer.json";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("preserves a fourth hand card before the Corp response at D37", () => {
  const capture = structuredClone(fixture) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(capture.validation).every(Boolean)).toBe(true);
  expect(capture.input.playerView.opponent).not.toHaveProperty("gripOrHq");
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    capture.input,
    capture.input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  const decision = chooseAiAction(capture.input);
  expect(
    capture.input.legalActions.some((a) => a.actionId === decision.actionId),
  ).toBe(true);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.actionId).toBe("runner.draw_card");
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.defense_and_recovery");
});
