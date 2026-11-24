import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type { GameState, LegalAction, Side } from "@netgrid/shared";
import { runCountForResult } from "./multiplayer";

describe("Engine-owned result run count (SP-760)", () => {
  it.each(["start_run", "play_event"] as const)(
    "counts a %s exactly once through payment, immediate stop and replay",
    (openingAction) => {
      const initial = freshGame();
      let state = submit(initial, "corp", "mandatory_draw");
      state = submit(
        state,
        "corp",
        "install_card",
        (action) =>
          action.payload?.serverId === "rd" &&
          action.payload.placement === "ice",
      );
      state = submit(state, "corp", "end_turn");

      const runnerClicks = state.runner.clicks;
      state = submit(
        state,
        "runner",
        openingAction,
        (action) => action.payload?.serverId === "rd",
      );
      expect(state.runner.clicks).toBe(runnerClicks - 1);
      expect(runCountForResult(state)).toBe(1);

      const corpCredits = state.corp.credits;
      state = submit(state, "corp", "rez_ice");
      expect(state.corp.credits).toBeLessThan(corpCredits);
      expect(runCountForResult(state)).toBe(1);

      state = submit(state, "runner", "continue_run");
      expect(state.run).toBeUndefined();
      expect(runCountForResult(state)).toBe(1);

      state = submit(
        state,
        "runner",
        "start_run",
        (action) => action.payload?.serverId === "rd",
      );
      state = submit(state, "runner", "continue_run");
      expect(state.run).toBeUndefined();
      expect(runCountForResult(state)).toBe(2);

      const replay = replayEvents(initial, state.eventLog);
      expect(replay.ok).toBe(true);
      expect(replay.actualFinalStateHash).toBe(hashState(state));
      expect(runCountForResult(replay.state)).toBe(2);
    },
  );

  it("starts at zero before any run and reads without mutating the state", () => {
    const state = freshGame();
    const before = hashState(state);
    expect(runCountForResult(state)).toBe(0);
    expect(hashState(state)).toBe(before);
  });

  it.each([undefined, -1, 1.5, Number.NaN])(
    "rejects an invalid Engine run counter: %s",
    (value) => {
      const state = freshGame();
      if (value === undefined) delete state.runnerTurnFlags!.runAttemptsThisGame;
      else state.runnerTurnFlags!.runAttemptsThisGame = value;
      expect(() => runCountForResult(state)).toThrowError(
        "The Engine run counter is missing or invalid.",
      );
      try {
        runCountForResult(state);
      } catch (error) {
        expect(error).toMatchObject({
          code: "match_result_run_counter_invalid",
          owner: "rules_contract",
          details: { source: "runnerTurnFlags.runAttemptsThisGame" },
        });
      }
    },
  );
});

function freshGame(): GameState {
  return createGameAfterSetup({
    seed: "server-run-result-count",
    runnerDeck: {
      id: "result-run-count-runner",
      name: "Run Event",
      side: "runner",
      identity: 587,
      cards: [{ id: 600, quantity: 8 }],
    },
    corpDeck: {
      id: "result-run-count-corp",
      name: "Barrier ICE",
      side: "corp",
      identity: 3,
      cards: [{ id: 589, quantity: 8 }],
    },
  });
}

function submit(
  state: GameState,
  side: Side,
  type: LegalAction["type"],
  applies: (action: LegalAction) => boolean = () => true,
): GameState {
  const action = getLegalActions(state, side).find(
    (candidate) => candidate.type === type && applies(candidate),
  );
  if (!action) throw new Error(`Missing ${side} action ${type} at ${state.timingPoint}`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
