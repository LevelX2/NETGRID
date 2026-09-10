import { describe, expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-known-damage-reserve-d135.json";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

describe("meta 403 known damage cannot consume the unknown-ICE reserve", () => {
  it.each([8, 30])(
    "quotes known damage avoidance before reserving unknown ICE with %i credits",
    (credits) => {
      const capture = structuredClone(checkpointJson) as unknown as {
        input: AiDecisionInputWithDeckCapabilities;
        runtime: AiRuntimeCheckpointV1;
      };
      capture.input.playerView.own.credits = credits;
      capture.input = {
        ...capture.input,
        ...buildAiDecisionInputDto(capture.input),
      };
      const quote = evaluateRunnerRunTargets({ input: capture.input }).find(
        (q) => q.actionId === "runner.start_run.rd",
      )!;
      expect(quote.pathPassability).toBe(
        credits === 8 ? "blocked_by_visible_damage_hand_buffer" : "reachable",
      );
      if (credits === 8) {
        resetResidentPlanPortfolioMemory();
        restoreAiRuntimeCheckpoint(
          capture.input,
          capture.input.ownDeckSnapshot!.deckSnapshotId,
          capture.runtime,
        );
        const result = chooseAiAction(capture.input);
        expect(result.actionId).not.toBe("runner.start_run.rd");
        expect(result.fallbackUsed).toBe(false);
      }
    },
  );
});
