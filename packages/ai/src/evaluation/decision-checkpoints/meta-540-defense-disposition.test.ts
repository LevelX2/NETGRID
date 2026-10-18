import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-540-r1-g38-d98-defense-disposition.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

it("keeps the native current tag-clear head authoritative over its incidental draw assessment", () => {
  expect(Object.values(checkpoint.validation).every(Boolean)).toBe(true);
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
  expect(input.playerView.own).toMatchObject({
    credits: 1,
    clicks: 4,
    tags: 4,
  });
  const action = input.legalActions.find(
    (a) => a.payload?.cardImplementationEffectKind === "remove_tags",
  )!;
  expect(action.costs).toContainEqual({ credits: 2, clicks: 2 });
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(action.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(
    decision.decisionDebug?.planFirstDecision?.turnPlanning?.coverage,
  ).toMatchObject({
    status: "pass",
    coveragePercent: 100,
    missingActionCount: 0,
    conflictingActionCount: 0,
  });
});
