import { getLegalActions, hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import puzzleJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-followup-puzzle-120.json";
import templeDiscardJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-followup-temple-discard-069.json";
import theorem167Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-followup-theorem-proof-167.json";
import theorem173Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-followup-theorem-proof-173.json";
import theorem183Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-followup-theorem-proof-183.json";
import activatedAbilityControlJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-04.json";
import { buildAiDecisionInput } from "../../index";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

const KRASH = "onr_v1_039_krash";
const TEMPLE_MICROCODE_OUTLET = "onr_v1_114_temple-microcode-outlet";

describe("F450 and 10311 follow-up decision checkpoints", () => {
  it.each([
    ["state version 279", theorem167Json],
    ["state version 291", theorem173Json],
    ["state version 309", theorem183Json],
  ])("scores the installed agenda at %s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("does not globally prefer arbitrary activated abilities", () => {
    expectCheckpointToPass(fixture(activatedAbilityControlJson));
  });

  it("retains breaker search access while the rig has no breaker", () => {
    expectCheckpointToPass(fixture(templeDiscardJson));
  });

  it("may discard breaker search access after breaker coverage is installed", () => {
    const coveredRig = mutateFixture(templeDiscardJson, (checkpoint) => {
      const state = checkpoint.engine.testOnlyGameState;
      const krashId = state.runner.stack.find(
        (cardId) => state.cardInstances[cardId]?.definitionId === KRASH,
      );
      if (!krashId) throw new Error("Missing Krash in captured stack");

      state.runner.stack = state.runner.stack.filter(
        (cardId) => cardId !== krashId,
      );
      state.runner.rig.programs.push(krashId);
      state.runner.memoryUsed += 1;
      state.cardInstances[krashId] = {
        ...state.cardInstances[krashId]!,
        zone: { side: "runner", zone: "rig" },
        faceup: true,
      };
      checkpoint.expectation = {
        discardChoice: {
          mustDiscardDefinitionIds: [TEMPLE_MICROCODE_OUTLET],
        },
      };
    });

    expectCheckpointToPass(coveredRig);
  });

  it("keeps the historical Puzzle continue decision as the tactical control", () => {
    expectCheckpointToPass(fixture(puzzleJson));
  });

  it("describes Puzzle's actual end-run and delayed self-trash effects", () => {
    const checkpoint = fixture(puzzleJson);
    const legalActions = getLegalActions(
      checkpoint.engine.testOnlyGameState,
      "runner",
    );
    const continueAction = legalActions.find(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );

    expect(continueAction?.payload).toMatchObject({
      encounterWillEndRun: true,
      encounterSourceWillTrashAtEndOfTurn: true,
    });

    const input = buildAiDecisionInput(
      checkpoint.engine.testOnlyGameState,
      checkpoint.actor,
      {
        difficulty: checkpoint.difficulty,
        profileId: checkpoint.profileId,
        decisionId: `${checkpoint.checkpointId}:payload-contract`,
        actionNumber: checkpoint.engine.stateVersion,
        ownDeckSnapshot: checkpoint.deckSnapshot,
        eventTail: checkpoint.engine.eventPrefix,
      },
    );
    const sanitizedContinueAction = input.legalActions.find(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );

    expect(sanitizedContinueAction?.payload).toMatchObject({
      encounterWillEndRun: true,
      encounterSourceWillTrashAtEndOfTurn: true,
    });
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function mutateFixture(
  value: unknown,
  mutation: (fixture: AiDecisionCheckpointV1) => void,
): AiDecisionCheckpointV1 {
  const result = fixture(value);
  mutation(result);
  result.engine.stateHash = hashGameState(result.engine.testOnlyGameState);
  return result;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
