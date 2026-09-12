import { expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-information-damage-d89.json";
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

it("preserves a payable damage response after an information boundary rejects full access", () => {
  const { input, runtime } = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  expect(input.playerView.own.credits).toBe(7);
  expect(input.playerView.own.gripOrHq).toHaveLength(3);
  expect(
    input.playerView.run?.encounteredIce?.effectiveRunQuote?.subroutines
      .filter((s) => s.type === "do_damage")
      .map((s) => s.amount),
  ).toEqual([2, 2]);
  const pump = input.legalActions.find(
    (action) => action.type === "pump_breaker",
  )!;
  expect(pump.costs).toEqual([{ credits: 1 }]);
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(pump.actionId);
  expect(decision.fallbackUsed).toBe(false);
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const root = portfolio.instances.find(
    (p) => p.instanceId === portfolio.rootForegroundInstanceId,
  )!;
  expect(root.moduleId).toBe("runner.pressure_central");
  const selected = decision.decisionDebug!.planFirstDecision!;
  expect(selected.selectedPlan).toMatchObject({
    moduleId: "runner.convert_run_window",
    parentInstanceId: root.instanceId,
  });
  expect(selected.selectedStep).toMatchObject({
    planInstanceId: selected.selectedPlan!.instanceId,
  });
});

it("does not buy an unaffordable full path after both damage subroutines are already broken", () => {
  const { input, runtime } = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const continuation = input.legalActions.find(
    (a) => a.type === "continue_run",
  )!;
  Object.assign(continuation.payload!, {
    encounterSubroutineIds:
      "printed_subroutines_end_the_run,printed_subroutines_end_the_run_a",
    unbrokenSubroutineCount: 2,
  });
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  expect(chooseAiAction(input).actionId).toBe(continuation.actionId);
});
