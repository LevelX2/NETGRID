import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import type { DeckDefinition, GameState, LegalAction } from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";

import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-910071d4b10c4a02-hq-followup-d19.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

it("reopens an affordable HQ follow-up after a non-converting access", () => {
  const checkpoint = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    stateVersion: number;
  };
  const { input } = checkpoint;
  const snapshotId = input.ownDeckSnapshot?.deckSnapshotId;
  if (!snapshotId) throw new Error("Missing Runner deck snapshot");

  const run = input.legalActions.find(
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "hq",
  );
  if (!run) throw new Error("Expected a legal HQ run");

  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(input, snapshotId, checkpoint.runtime);

  const decision = chooseAiAction(input);
  const owner = planInstanceIdForProposal({
    moduleId: "runner.pressure_central",
    dedupeKey: "central:hq",
  });

  expect(decision).toMatchObject({
    actionId: run.actionId,
    fallbackUsed: false,
    timeoutUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: owner,
        leafExecutorInstanceId: owner,
        selectedStep: {
          planInstanceId: owner,
          stepId: `${owner}:pressure:hq`,
        },
        route: {
          actionId: run.actionId,
          stateVersion: checkpoint.stateVersion,
        },
      },
    },
  });
});

const runnerDeck: DeckDefinition = {
  id: "hq-followup-runner",
  side: "runner",
  name: "HQ follow-up Runner",
  identity: 587,
  cards: [208, 223, 251].map((id) => ({ id, quantity: 3 })),
};

const corpDeck: DeckDefinition = {
  id: "hq-followup-corp",
  side: "corp",
  name: "HQ follow-up Corp",
  identity: 3,
  cards: [449, 500, 502, 507].map((id) => ({ id, quantity: 3 })),
};

function playOffered(
  state: GameState,
  side: LegalAction["side"],
  type: LegalAction["type"],
  serverId?: "hq",
): GameState {
  const action = getLegalActions(state, side).find(
    (candidate) =>
      candidate.type === type &&
      (serverId === undefined || candidate.payload?.serverId === serverId),
  );
  if (!action) throw new Error(`Expected ${type} at ${state.timingPoint}`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function stateAfterHqAccess(protectedHq: boolean): GameState {
  let state = createGameAfterSetup({
    seed: "hq-followup-countercases",
    runnerDeck,
    corpDeck,
  });
  const board = RealEngineFixtureBuilder.forState(state).withCorpHqSize(0);
  if (protectedHq) {
    board
      .withCorpCardInHq(502)
      .withCorpCardInHq(507)
      .withRezzedCorpIceOnServer("hq", 449)
      .withRunnerProgramInstalled(251)
      .withRunnerCredits(2);
  }
  const top = state.corp.rd.findIndex(
    (id) => state.cardInstances[id]?.definitionId === 500,
  );
  if (top < 0) throw new Error("Expected Day Shift in R&D");
  state.corp.rd.unshift(...state.corp.rd.splice(top, 1));
  state = playOffered(state, "corp", "mandatory_draw");
  state = playOffered(state, "corp", "end_turn");
  state = playOffered(state, "runner", "start_run", "hq");
  if (protectedHq) {
    state = playOffered(state, "runner", "break_subroutine");
    state = playOffered(state, "runner", "continue_run");
    state = playOffered(state, "runner", "continue_run");
  }
  return playOffered(state, "runner", "access_card");
}

it.each([
  ["an exhausted known hand", false],
  ["an unfunded repeat through rezzed ICE", true],
] as const)("excludes the legal HQ run against %s", (_, protectedHq) => {
  const state = stateAfterHqAccess(protectedHq);
  const input = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: runnerDeck.id,
      side: "runner",
      cards: runnerDeck.cards.map(({ id, quantity }) => ({
        cardId: id,
        quantity,
      })),
    },
  });
  expect(input.playerView.timingPoint).toBe("runner_action.main");
  const run = input.legalActions.find(
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "hq",
  );
  if (!run) throw new Error("Expected a legal repeat HQ run");
  const decision = chooseAiAction(input);
  expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
    expect.objectContaining({ actionId: run.actionId, excluded: true }),
  );
});
