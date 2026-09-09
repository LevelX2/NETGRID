import { describe, expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-bank-reserve-d204.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

describe("meta 403 bank funding materializes the bound run reserve", () => {
  it.each([0, 4])(
    "funds the remaining unknown ICE reserve of %i at the exact payment window",
    (reserve) => {
      const capture = structuredClone(checkpointJson) as unknown as {
        input: AiDecisionInputWithDeckCapabilities;
        previousInput: AiDecisionInputWithDeckCapabilities;
        runtime: AiRuntimeCheckpointV1;
      };
      const parent = capture.runtime.residentPlanPortfolio!.instances.find(
        (p) => p.moduleId === "runner.pressure_central",
      )!;
      const { signal } = parent.moduleState as {
        signal: {
          runRiskContract: { reserveQuote: { requiredCredits: number } };
        };
      };
      signal.runRiskContract.reserveQuote.requiredCredits = reserve;
      capture.input = {
        ...capture.input,
        ...buildAiDecisionInputDto(capture.input),
      };
      resetResidentPlanPortfolioMemory();
      restoreAiRuntimeCheckpoint(
        capture.previousInput,
        capture.input.ownDeckSnapshot!.deckSnapshotId,
        capture.runtime,
      );
      const beforePayment = chooseAiAction(capture.previousInput);
      expect(
        capture.previousInput.legalActions.find(
          (a) => a.actionId === beforePayment.actionId,
        )?.type,
      ).toBe("break_subroutine");
      const result = chooseAiAction(capture.input);
      const selected = capture.input.legalActions.find(
        (a) => a.actionId === result.actionId,
      )!;
      expect(selected.type).toBe(
        reserve === 4 ? "activated_card_ability" : "break_subroutine",
      );
      expect(result.fallbackUsed).toBe(false);
      expect(result.decisionDebug?.planFirstDecision).toMatchObject({
        rootPlanInstanceId: "plan:runner.pressure_central:central%3Ard",
        leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_189",
      });
    },
  );
});
