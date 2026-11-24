import { getLegalActions, hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import puzzleJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-followup-puzzle-120.json";
import templeDiscardJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-followup-temple-discard-069.json";
import theorem167Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-followup-theorem-proof-167.json";
import theorem173Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-followup-theorem-proof-173.json";
import theorem183Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-followup-theorem-proof-183.json";
import activatedAbilityControlJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-04.json";
import { buildAiDecisionInput } from "../../index";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { runnerInstalledAgendaScoreSignals } from "../../runner/installed-agenda/installed-agenda-signals";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { withCurrentF450DamageZoneExpectation } from "./f450-damage-zone-fixture.test-support";

const KRASH = 251;
const TEMPLE_MICROCODE_OUTLET = 326;
const SCORE = 320;

describe("F450 and 10311 follow-up decision checkpoints", () => {
  it.each([
    ["state version 279", theorem167Json],
    ["state version 291", theorem173Json],
    ["state version 309", theorem183Json],
  ])("scores the installed agenda at %s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("rejects malformed bindings from the native Theorem Proof score offer", () => {
    const checkpoint = fixture(theorem167Json);
    const input = buildAiDecisionInput(
      checkpoint.engine.testOnlyGameState,
      "runner",
      {
        ownDeckSnapshot: checkpoint.deckSnapshot,
        eventTail: checkpoint.engine.eventPrefix,
      },
    );
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
    });
    const [score] = runnerInstalledAgendaScoreSignals(input, candidates);
    expect(score).toMatchObject({
      agendaPoints: 3,
      observedAtStateVersion: input.playerView.stateVersion,
      terminal: false,
    });
    for (const kind of ["version", "side", "source", "points"] as const) {
      const changed = structuredClone(input);
      const action = changed.legalActions.find(
        (offer) => offer.actionId === score!.actionIds[0],
      )!;
      if (kind === "version") action.expiresAtStateVersion--;
      if (kind === "side") action.side = "corp";
      if (kind === "source") action.source = "different-source";
      if (kind === "points")
        changed.playerView.own.rig!.find(
          (card) => card.instanceId === action.source,
        )!.agendaPoints = Infinity;
      expect(() =>
        runnerInstalledAgendaScoreSignals(changed, candidates),
      ).toThrow("invalid_player_view_card_projection");
    }
  });

  it("keeps the current active-zone R&D pressure control", () => {
    expectCheckpointToPass(
      withCurrentF450DamageZoneExpectation(fixture(activatedAbilityControlJson)),
    );
  });

  it("retains breaker search access while the rig has no breaker", () => {
    expectCheckpointToPass(fixture(templeDiscardJson));
  });

  it("discards redundant burst economy before breaker search access at high credits after coverage", () => {
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
          mustDiscardDefinitionIds: [SCORE],
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
  const checkpoint = bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    ["cp-f450-10311-funded-cybermodem"],
  );
  return checkpoint;
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
