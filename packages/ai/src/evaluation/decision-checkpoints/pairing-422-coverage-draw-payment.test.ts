import type { AiDecisionInput } from "@netgrid/shared";
import { expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-coverage-draw-payment-d39.json";
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

it("preserves the bound coverage draw through its payment support window", () => {
  const capture = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    capture.input,
    capture.input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  const original =
    capture.runtime.residentPlanPortfolio!
      .pendingRunnerCostPenaltySupportOrigin!;
  const decision = chooseAiAction(capture.input as AiDecisionInput);
  expect(
    capture.input.legalActions.some(
      (action) => action.actionId === decision.actionId,
    ),
  ).toBe(true);
  expect(decision.fallbackUsed).toBe(false);
  const portfolio = residentPlanPortfolioSnapshot(capture.input)!;
  const coverage = portfolio.instances.find(
    (instance) => instance.instanceId === original.executorInstanceId,
  )!;
  expect(coverage.moduleId).toBe("runner.rig_and_coverage");
  expect(coverage.moduleState).toMatchObject({
    kind: "coverage",
    phase: "draw_for_answer",
    gap: {
      drawForAnswerActionIds: expect.arrayContaining([
        original.originalActionId,
      ]),
    },
  });
  expect(portfolio.pendingRunnerCostPenaltySupportOrigin).toMatchObject(
    original,
  );
});
