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
        identity: "runner_identity_001",
        cards: [
          "onr_v1_039_krash",
          "onr_v1_014_codecracker",
          "onr_v1_095_jack-n-joe",
          "onr_v1_108_score",
          "onr_v1_097_livewires-contacts",
        ].map((id) => ({ id, quantity: 3 })),
      },
      corpDeck: {
        id: "bp-access-corp",
        name: "BP access",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "onr_v1_215_security-net-optimization", quantity: 3 },
          { id: "onr_v1_245_fire-wall", quantity: 3 },
          { id: "onr_v1_270_sleeper", quantity: 3 },
          { id: "simple_agenda", quantity: 8 },
        ],
      },
    }),
    "corp",
    "mandatory_draw",
  );
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpRemoteRoot("remote_1", "onr_v1_215_security-net-optimization")
    .withRezzedCorpIceOnServer("remote_1", "onr_v1_270_sleeper")
    .withRezzedCorpIceOnServer("remote_1", "onr_v1_245_fire-wall")
    .withRunnerProgramInstalled("onr_v1_039_krash")
    .withRunnerProgramInstalled("onr_v1_014_codecracker")
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
            { cardId: "onr_v1_215_security-net-optimization", quantity: 3 },
            { cardId: "onr_v1_245_fire-wall", quantity: 3 },
            { cardId: "onr_v1_270_sleeper", quantity: 3 },
            { cardId: "simple_agenda", quantity: 8 },
          ],
        },
      });
      expect(input.playerView.runnerNextTurnCreditClicks).toBe(3);
      const defense = assessCorpTerminalAgendaDefense(
        input,
        "remote_1",
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
      runner = applyStep(runner, "runner", "start_run", "remote_1");
      expect(runner.runner.credits).toBe(10);
      expect(runner.run?.badPublicityCredits).toBe(badPublicity);
    },
  );
});
