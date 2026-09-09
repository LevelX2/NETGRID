import { describe, expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-run-only-pump-d224.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

describe("meta 403 run-only credits survive the pump viability quote", () => {
  it.each([0, 1])(
    "funds the ten-credit encounter with nine cash and %i run credits",
    (runCredits) => {
      const capture = structuredClone(checkpointJson) as unknown as {
        input: AiDecisionInputWithDeckCapabilities;
        runtime: AiRuntimeCheckpointV1;
      };
      capture.input.playerView.run!.badPublicityCredits = runCredits;
      capture.input = {
        ...capture.input,
        ...buildAiDecisionInputDto(capture.input),
      };
      resetResidentPlanPortfolioMemory();
      restoreAiRuntimeCheckpoint(
        capture.input,
        capture.input.ownDeckSnapshot!.deckSnapshotId,
        capture.runtime,
      );
      const decision = chooseAiAction(capture.input);
      const selected = capture.input.legalActions.find(
        (action) => action.actionId === decision.actionId,
      )!;
      expect(selected.type).toBe(
        runCredits === 1 ? "pump_breaker" : "continue_run",
      );
      expect(decision.fallbackUsed).toBe(false);
      expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
        rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
        leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_223",
      });
    },
  );
});
