import { describe, expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-probe-damage-d152.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

describe("meta 403 information run preserves its bound damage reserve", () => {
  it.each([0, 2])(
    "preserves the information run's bound hand reserve of %i cards",
    (handReserve) => {
      const capture = structuredClone(checkpointJson) as unknown as {
        input: AiDecisionInputWithDeckCapabilities;
        runtime: AiRuntimeCheckpointV1;
      };
      // Change only the bound parent contract, leaving the real visible board,
      // legal actions and the immediate nonlethal damage consequence intact.
      const parent = capture.runtime.residentPlanPortfolio!.instances.find(
        (instance) => instance.moduleId === "runner.contest_remote",
      )!;
      const { signal } = parent.moduleState as {
        signal: {
          runRiskContract: { reserveQuote: { requiredHandBuffer: number } };
        };
      };
      signal.runRiskContract.reserveQuote.requiredHandBuffer = handReserve;
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
      expect(capture.input.playerView.own.credits).toBe(15);
      expect(capture.input.playerView.own.gripOrHq).toHaveLength(4);
      const result = chooseAiAction(capture.input);
      const selected = capture.input.legalActions.find(
        (action) => action.actionId === result.actionId,
      )!;
      expect(selected.type).toBe(
        handReserve === 2 ? "pump_breaker" : "continue_run",
      );
      expect(result.fallbackUsed).toBe(false);
      expect(result.decisionDebug?.planFirstDecision).toMatchObject({
        rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_150",
      });
    },
  );
});
