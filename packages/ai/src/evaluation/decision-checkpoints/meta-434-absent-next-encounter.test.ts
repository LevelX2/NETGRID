import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { encounterHasImmediateUnbrokenThreat } from "../../runtime/current-encounter";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const checkpoint: unknown = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r3-g19-d87.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

function restoredInput() {
  const { input, runtime } = structuredClone(checkpoint) as {
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

it("keeps six credits instead of pumping to break a lock with no following encounter", () => {
  const input = restoredInput();
  const continuation = input.legalActions.find(
    (a) => a.type === "continue_run",
  )!;
  expect(input.playerView.own.credits).toBe(8);
  expect(chooseAiAction(input)).toMatchObject({
    actionId: continuation.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
        leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_82",
        route: {
          actionId: continuation.actionId,
          stateVersion: input.playerView.stateVersion,
        },
      },
    },
  });
});

it("does not report a next-encounter-only lock as a current threat on the last ICE", () => {
  expect(encounterHasImmediateUnbrokenThreat(restoredInput())).toBe(false);
});

it("retains the lock threat when a following ICE remains", () => {
  const input = restoredInput();
  if (input.playerView.run!.position!.kind !== "ice")
    throw Error("fixture position");
  input.playerView.run!.position!.iceIndex = 1;
  expect(encounterHasImmediateUnbrokenThreat(input)).toBe(true);
});

it("retains the lock threat when the encounter can redirect to another ICE", () => {
  const input = restoredInput();
  input.playerView.run!.encounteredIce!.effectiveRunQuote!.subroutines.push({
    id: "redirect-boundary",
    type: "deflect_run",
  });
  expect(encounterHasImmediateUnbrokenThreat(input)).toBe(true);
});

it("preserves an existing full-break obligation on the current ICE", () => {
  const input = restoredInput();
  input.legalActions.find(
    (a) => a.type === "continue_run",
  )!.payload!.encounterFullBreakDamage = 1;
  expect(encounterHasImmediateUnbrokenThreat(input)).toBe(true);
});

it("preserves current damage when only the next-encounter lock lacks a target", () => {
  const input = restoredInput();
  input.playerView.run!.encounteredIce!.effectiveRunQuote!.subroutines.push({
    id: "current-damage-boundary",
    type: "do_damage",
    amount: 1,
    damageType: "net",
  });
  expect(encounterHasImmediateUnbrokenThreat(input)).toBe(true);
});
