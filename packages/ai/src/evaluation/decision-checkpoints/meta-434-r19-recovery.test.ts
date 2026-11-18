import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
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

it.each([5, 7])(
  "admits recovery only when the sequential cleanup retains it at hand limit %i",
  (maxHandSize) => {
    const { input, runtime } = JSON.parse(
      readFileSync(
        new URL(
          "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r19-g18-d162.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ) as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    input.playerView.own.maxHandSize = maxHandSize;
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const recovery = input.legalActions.find(
      (a) => a.payload?.targetCardId === "c275",
    )!;
    const result = chooseAiAction(input);
    expect(result.actionId).not.toBe(recovery.actionId);
    if (maxHandSize === 7) {
      expect(result.actionId).toBe("r8");
      expect(result.decisionDebug?.planFirstDecision?.portfolio).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            moduleId: "runner.develop_board_and_hand",
            viability: "ready",
            evidenceCodes: expect.arrayContaining([
              "runner_recovery_search_target:c275:card_specific_purpose:generic_heap_recovery",
            ]),
          }),
        ]),
      );
    }
    expect(result.fallbackUsed).toBe(false);
    expect(result.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: result.actionId,
      stateVersion: input.playerView.stateVersion,
    });
    const executor = residentPlanPortfolioSnapshot(input)!.instances.find(
      (instance) =>
        instance.instanceId ===
        result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    );
    expect(executor).toMatchObject({
      moduleId:
        maxHandSize === 7 ? "runner.develop_board_and_hand" : "runner.economy",
      executionState: "executor",
    });
  },
);
