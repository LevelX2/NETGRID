import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-future-only-rez.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("SP-287 preserves five credits by declining a future-only rez at the actual D9 checkpoint", () => {
  const { input, runtime } = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  expect(input.playerView.stateVersion).toBe(8);
  expect(input.playerView.own.credits).toBe(5);
  const decline = input.legalActions.find(
    (action) => action.type === "decline_rez",
  )!;
  expect(decline.expiresAtStateVersion).toBe(8);
  expect(chooseAiAction(input)).toMatchObject({
    actionId: decline.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "penw02zfrkklof54c2nuye5att",
        leafExecutorInstanceId:
          "penw02zfrkklof54c2nuye5att",
        route: { actionId: decline.actionId },
      },
    },
  });
});
