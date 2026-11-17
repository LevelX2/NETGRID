import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import type { GameState, LegalAction, Side } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { RealEngineFixtureBuilder } from "../../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { assessCorpTerminalAgendaDefense } from "../defense/corp-terminal-agenda-defense";

function applyStep(
  state: GameState,
  side: Side,
  type: LegalAction["type"],
  serverId?: string,
): GameState {
  const action = getLegalActions(state, side).find(
    (candidate) =>
      candidate.type === type &&
      (serverId === undefined || candidate.payload?.serverId === serverId),
  );
  if (!action) throw new Error("Missing native action " + type);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function position(badPublicity: number): GameState {
  const state = applyStep(
    createGameAfterSetup({
      seed: "terminal-remote-bad-publicity-credits",
      runnerDeck: {
        id: "bp-access-runner",
        name: "BP access",
        side: "runner",
        identity: 587,
        cards: [
          251,
          226,
          307,
          320,
          309,
        ].map((id) => ({ id, quantity: 3 })),
      },
      corpDeck: {
        id: "bp-access-corp",
        name: "BP access",
        side: "corp",
        identity: 3,
        cards: [
          { id: 427, quantity: 3 },
          { id: 457, quantity: 3 },
          { id: 482, quantity: 3 },
          { id: 588, quantity: 8 },
        ],
      },
    }),
    "corp",
    "mandatory_draw",
  );
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpRemoteRoot("r1", 427)
    .withRezzedCorpIceOnServer("r1", 482)
    .withRezzedCorpIceOnServer("r1", 457)
    .withRunnerProgramInstalled(251)
    .withRunnerProgramInstalled(226)
    .withRunnerCredits(7);
  state.corp.badPublicity = badPublicity;
  return state;
}

describe("public next-run credits in a Corp protection assessment", () => {
  it.each([
    [0, 0],
    [1, 1],
  ])(
    "quotes the exact access threshold with %i bad publicity",
    (badPublicity, expectedAccess) => {
      const state = position(badPublicity);
      const input = buildAiDecisionInput(state, "corp", {
        difficulty: "hard",
        ownDeckSnapshot: {
          deckSnapshotId: "bp-access-corp",
          side: "corp",
          cards: [
            { cardId: 427, quantity: 3 },
            { cardId: 457, quantity: 3 },
            { cardId: 482, quantity: 3 },
            { cardId: 588, quantity: 8 },
          ],
        },
      });
      expect(input.playerView.runnerNextTurnCreditClicks).toBe(3);
      const defense = assessCorpTerminalAgendaDefense(
        input,
        "r1",
        "agenda:terminal",
      );
      expect(defense?.need.baseline).toMatchObject({
        knowledge: "known",
        protection: {
          runnerAccessSuccessProbability: {
            numerator: expectedAccess,
            denominator: 1,
          },
          protectsScore: expectedAccess === 0,
          ...(expectedAccess === 1
            ? { runnerCreditsRemainingOnBestAccessPath: 0 }
            : {}),
        },
      });

      let runner = applyStep(state, "corp", "end_turn");
      for (let i = 0; i < 3; i++)
        runner = applyStep(runner, "runner", "gain_credit");
      runner = applyStep(runner, "runner", "start_run", "r1");
      expect(runner.runner.credits).toBe(10);
      expect(runner.run?.badPublicityCredits).toBe(badPublicity);
    },
  );
});
