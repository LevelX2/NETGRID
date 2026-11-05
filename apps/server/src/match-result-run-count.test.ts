import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { applyAction, createGame, hashState } from "@netgrid/engine";
import { buildEngineDeck } from "@netgrid/decks";
import type { GameState, PlayerAction, Side, StateHash } from "@netgrid/shared";
import { runCountForResult } from "./multiplayer";

type RecordedAction = {
  decision: number;
  side: Side;
  actionId: string;
  selectedChoices?: PlayerAction["selectedChoices"];
  selectedTargets?: PlayerAction["selectedTargets"];
  beforeHash: StateHash;
  afterHash: StateHash;
};

const fixture = JSON.parse(
  readFileSync(
    new URL("./test-fixtures/run-result-counter-599.json", import.meta.url),
    "utf8",
  ),
) as {
  snapshots: {
    runner: Parameters<typeof buildEngineDeck>[0];
    corp: Parameters<typeof buildEngineDeck>[0];
  };
  controllers: NonNullable<
    NonNullable<Parameters<typeof createGame>[0]>["controllers"]
  >;
  games: {
    gameNumber: number;
    seed: string;
    matchId: string;
    initialState: GameState;
    finalHash: StateHash;
    runCount: number;
    reportedRunCount: number;
    actions: RecordedAction[];
  }[];
};

describe("Engine-owned result run count (SP-760)", () => {
  it.each(fixture.games)(
    "replays the real opening/payment/immediate-stop case G$gameNumber",
    (game) => {
      // These are the exact original initial states, not manufactured AI roles
      // or repaired historical replays. Every original transition stays bound.
      let state = structuredClone(game.initialState);
      for (const action of game.actions) {
        expect(hashState(state)).toBe(action.beforeHash);
        const result = applyAction(state, {
          matchId: state.matchId,
          side: action.side,
          actionId: action.actionId,
          clientKnownStateVersion: state.stateVersion,
          ...(action.selectedChoices
            ? { selectedChoices: action.selectedChoices }
            : {}),
          ...(action.selectedTargets
            ? { selectedTargets: action.selectedTargets }
            : {}),
        });
        if (!result.ok) throw new Error(JSON.stringify(result.error));
        expect(hashState(result.state)).toBe(action.afterHash);
        state = result.state;
      }
      expect(hashState(state)).toBe(game.finalHash);
      expect(runCountForResult(state)).toBe(game.runCount);
      expect(game.runCount).toBe(
        { 3: 23, 8: 23, 21: 21 }[game.gameNumber],
      );
    },
    60_000,
  );

  function freshGame(): GameState {
    return createGame({
      matchId: "run-count-before-first-run",
      seed: "run-count-before-first-run",
      controllers: fixture.controllers,
      runnerDeck: buildEngineDeck(fixture.snapshots.runner),
      corpDeck: buildEngineDeck(fixture.snapshots.corp),
      runnerDeckMetadata: fixture.snapshots.runner.publicMetadata,
      corpDeckMetadata: fixture.snapshots.corp.publicMetadata,
    });
  }

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
