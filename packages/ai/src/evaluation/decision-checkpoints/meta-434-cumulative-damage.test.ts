import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { currentEncounterRequiresDamagePreservingBreak } from "../../runtime/current-encounter-damage";
import { encounterContinueAcceptsOnlyNonlethalDamageThreats } from "../../runtime/encounter-subroutine";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

// Read the full real checkpoint as test data without asking TypeScript to
// infer structural types for every historical event and legal-action row.
const checkpoint: unknown = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r2-g3-d325.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

function restoredInput() {
  const { input, runtime } = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  return input;
}

it("funds current cumulative lethal damage mitigation even when the later access path is unaffordable", () => {
  const input = restoredInput();
  const pump = input.legalActions.find(
    (action) => action.type === "pump_breaker",
  )!;
  expect(input.playerView.own.gripOrHq).toHaveLength(3);
  expect(input.playerView.own.credits).toBe(20);
  expect(chooseAiAction(input)).toMatchObject({
    actionId: pump.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
        leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_321",
        route: {
          actionId: pump.actionId,
          stateVersion: input.playerView.stateVersion,
        },
      },
    },
  });
});

it("does not spend the same three-card hand on each two-damage subroutine", () => {
  const input = restoredInput();
  expect(currentEncounterRequiresDamagePreservingBreak(input, 0)).toBe(true);
  expect(encounterContinueAcceptsOnlyNonlethalDamageThreats(input)).toBe(false);
});

it("preserves the nonlethal boundary when the whole remaining damage fits the hand", () => {
  const input = restoredInput();
  input.playerView.own.gripOrHq.push({
    ...input.playerView.own.gripOrHq[0]!,
    instanceId: "boundary-extra-hand-card",
  });
  expect(currentEncounterRequiresDamagePreservingBreak(input, 0)).toBe(false);
  expect(encounterContinueAcceptsOnlyNonlethalDamageThreats(input)).toBe(true);
});

it.each([1, 2])(
  "excludes %i already broken damage subroutines using the exact Engine remainder",
  (brokenCount) => {
    const input = restoredInput();
    const action = input.legalActions.find((a) => a.type === "continue_run")!;
    const ids = String(action.payload!.encounterSubroutineIds)
      .split(",")
      .slice(brokenCount);
    action.payload!.encounterSubroutineIds = ids.join(",");
    action.payload!.unbrokenSubroutineCount = ids.length;
    expect(currentEncounterRequiresDamagePreservingBreak(input, 0)).toBe(false);
    expect(encounterContinueAcceptsOnlyNonlethalDamageThreats(input)).toBe(
      brokenCount === 1,
    );
  },
);

it("deducts available typed prevention once from the aggregate damage", () => {
  const input = restoredInput();
  input.playerView.own.freeNetOrCoreDamagePreventionRemaining = 1;
  expect(currentEncounterRequiresDamagePreservingBreak(input, 0)).toBe(false);
  expect(encounterContinueAcceptsOnlyNonlethalDamageThreats(input)).toBe(true);
});

it("retains the bound hand reserve even for damage that is not itself lethal", () => {
  const input = restoredInput();
  input.playerView.own.freeNetOrCoreDamagePreventionRemaining = 2;
  expect(currentEncounterRequiresDamagePreservingBreak(input, 0)).toBe(false);
  expect(currentEncounterRequiresDamagePreservingBreak(input, 2)).toBe(true);
});
