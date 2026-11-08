import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";

const checkpoint = JSON.parse(
  readFileSync(
    new URL("./fixtures/meta641-d175-draw-rotation.json", import.meta.url),
    "utf8",
  ),
) as {
  validation: Record<string, boolean>;
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};

afterEach(resetResidentPlanPortfolioMemory);

it("uses an installed single-card draw for the native full-hand rotation", () => {
  expect(Object.keys(checkpoint.validation)).toHaveLength(9);
  expect(Object.values(checkpoint.validation).every(Boolean)).toBe(true);
  const input = structuredClone(checkpoint.input);
  expect(input.playerView.own.gripOrHq).toHaveLength(5);
  expect(input.playerView.own.maxHandSize).toBe(5);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    structuredClone(checkpoint.runtime),
  );
  const before = JSON.stringify(input.playerView);
  const action = input.legalActions.find(
    (a) => a.payload?.cardId === "runner_onr_v1_179_silicon-saloon-franchise_1",
  );
  expect(action).toBeDefined();
  const decision = chooseAiAction(input);
  expect(JSON.stringify(input.playerView)).toBe(before);
  expect(decision).toMatchObject({
    actionId: action!.actionId,
    fallbackUsed: false,
    timeoutUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "plan:runner.develop_board_and_hand:generic%3Adraw-options",
        leafExecutorInstanceId: "plan:runner.develop_board_and_hand:generic%3Adraw-options",
        route: { actionId: action!.actionId, stateVersion: 174 },
      },
    },
  });
});
