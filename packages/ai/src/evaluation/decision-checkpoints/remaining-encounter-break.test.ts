import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-remaining-encounter-break.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { currentEncounterUnbrokenSubroutineIndexes } from "../../runtime/current-encounter";
import { restoreAiRuntimeCheckpoint, type AiRuntimeCheckpointV1 } from "./runtime-checkpoint";

function fixture() {
  const { input, runtime } = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const dto = buildAiDecisionInputDto({ ...input, matchId: input.matchId!, actionNumber: 402 });
  input.playerView = dto.playerView;
  input.legalActions = dto.legalActions;
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, runtime);
  return input;
}

it("SP-346 pays the last open ETR without rebudgeting a previously broken subroutine", () => {
  const input = fixture();
  expect(input.playerView.own.credits).toBe(2);
  expect(currentEncounterUnbrokenSubroutineIndexes(input)).toEqual(new Set([1]));
  const action = input.legalActions.find((action) => action.type === "break_subroutine")!;
  expect(action.costs).toEqual([{ credits: 2 }]);
  expect(chooseAiAction(input)).toMatchObject({
    actionId: action.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_2",
        leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_395",
        route: { actionId: action.actionId },
      },
    },
  });
});

it("rejects a missing authoritative remainder instead of counting printed subroutines", () => {
  const input = fixture();
  const continuation = input.legalActions.find((action) => action.type === "continue_run")!;
  delete continuation.payload!.encounterSubroutineIds;
  expect(() => chooseAiAction(input)).toThrow();
});

it("does not pretend a genuinely open second ETR was already broken", () => {
  const input = fixture();
  const continuation = input.legalActions.find((action) => action.type === "continue_run")!;
  continuation.payload!.encounterSubroutineIds = "printed_subroutines_end_the_run,printed_subroutines_end_the_run_a";
  continuation.payload!.unbrokenSubroutineCount = 2;
  const otherBreak = structuredClone(input.legalActions.find((action) => action.type === "break_subroutine")!);
  otherBreak.actionId = otherBreak.actionId.replace(".1.printed_subroutines_end_the_run_a.", ".0.printed_subroutines_end_the_run.");
  otherBreak.payload!.subroutineIndex = 0;
  input.legalActions.push(otherBreak);
  expect(currentEncounterUnbrokenSubroutineIndexes(input)).toEqual(new Set([0, 1]));
  expect(chooseAiAction(input).actionId).toBe(continuation.actionId);
});
