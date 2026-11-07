import { describe, expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-probe-damage-d152.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { activeRunRootPlan } from "../../runner/run-window/run-window-origin";
import { runnerCurrentEncounterRequiresDamagePreservingBreak } from "../../runner/run-window/run-window-assessment";
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
      // A zero floor permits nonlethal damage; it does not force losing four
      // cards when the current exact break is affordable. Check the obligation
      // separately from the chooser's useful optional mitigation.
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
      const origin = activeRunRootPlan(
        capture.runtime.residentPlanPortfolio,
        capture.input,
      );
      expect(
        runnerCurrentEncounterRequiresDamagePreservingBreak(
          capture.input,
          origin,
        ),
      ).toBe(handReserve === 2);
      const result = chooseAiAction(capture.input);
      const selected = capture.input.legalActions.find(
        (action) => action.actionId === result.actionId,
      )!;
      expect(selected.type).toBe("pump_breaker");
      expect(result.fallbackUsed).toBe(false);
      expect(result.decisionDebug?.planFirstDecision).toMatchObject({
        rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_150",
      });
    },
  );
});
