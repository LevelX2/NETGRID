import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
const checkpointJson: unknown = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-dreff-447-region-overflow-d117.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("does not spend five credits replacing the active identical HQ region to relieve hand overflow (SP-383)", () => {
  const capture = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const input = capture.input;
  const replacement = input.legalActions.find(
    (a) =>
      a.payload?.serverId === "hq" &&
      a.payload.regionReplacementWarning === true,
  )!;
  expect(replacement.costs.reduce((sum, c) => sum + (c.credits ?? 0), 0)).toBe(
    5,
  );
  expect(input.playerView.own.gripOrHq.length).toBeGreaterThan(
    input.playerView.own.maxHandSize,
  );
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).not.toBe(replacement.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(
    input.legalActions.find((a) => a.actionId === decision.actionId),
  ).toBeDefined();
});
