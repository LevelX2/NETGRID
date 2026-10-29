import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
function fixture(game: number, decision: number) {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta567-denial-g" +
          game +
          "-d" +
          decision +
          ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
}
afterEach(resetResidentPlanPortfolioMemory);
it.each([
  [2, 419, "priority-wreck", 22],
  [35, 300, "edited-shipping", 14],
] as const)(
  "does not give G%i D%i a profitable access value for a losing economic route",
  (game, decision, definition, pathCost) => {
    const { input, runtime, validation } = fixture(game, decision);
    expect(Object.values(validation)).toEqual(Array(9).fill(true));
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const before = JSON.stringify(input),
      targets = evaluateRunnerRunTargets({
        input,
        deckCapabilities: input.ownDeckCapabilities!,
      }),
      route = targets.find((t) => t.actionId.includes(definition))!;
    expect(route.pathCost).toBe(pathCost);
    expect(route.unknownUnrezzedIceCount).toBe(0);
    expect(route.score).toBeLessThanOrEqual(0);
    const result = chooseAiAction(input);
    expect(result.actionId).not.toBe(route.actionId);
    expect(result).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
    expect(input.legalActions.some((a) => a.actionId === result.actionId)).toBe(
      true,
    );
    expect(JSON.stringify(input)).toBe(before);
    expect(result.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: result.actionId,
      stateVersion: input.playerView.stateVersion,
    });
  },
);
it("preserves the genuinely useful zero-path-cost denial at G11 D311 under the same Central owner", () => {
  const { input, runtime } = fixture(11, 311);
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const before = JSON.stringify(input),
    route = evaluateRunnerRunTargets({
      input,
      deckCapabilities: input.ownDeckCapabilities!,
    }).find((t) => t.actionId.includes("priority-wreck"))!;
  expect(route.pathCost).toBe(0);
  expect(route.score).toBeGreaterThan(0);
  const result = chooseAiAction(input);
  expect(result.actionId).toBe(route.actionId);
  expect(result).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  expect(result.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "runner.pressure_central",
  );
  expect(JSON.stringify(input)).toBe(before);
});
