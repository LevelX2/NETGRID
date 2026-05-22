// ARCH-2 game facade smoke tests: assert delegation only, not gameplay semantics.
import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGame as createLegacyGame,
  createGameAfterSetup as createLegacyGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
  validateGameState,
} from "../index";
import {
  applyGameAction,
  createGame,
  createGameAfterSetup,
  hashGameState,
  legalActionsFor,
  playerViewFor,
  replayGameEvents,
  validateGameStateForDebug,
} from "./index";

describe("game facade", () => {
  it("delegates to the existing engine API", () => {
    const state = createGame({
      seed: "arch-2-game-facade",
      setupMode: "completed",
    });
    const legacyState = createLegacyGame({
      seed: "arch-2-game-facade",
      setupMode: "completed",
    });
    const mandatoryDraw = getLegalActions(state, "corp").find(
      (action) => action.type === "mandatory_draw",
    );

    expect(state).toEqual(legacyState);
    expect(legalActionsFor(state, "corp")).toEqual(getLegalActions(state, "corp"));
    expect(playerViewFor(state, "corp")).toEqual(getPlayerView(state, "corp"));
    expect(hashGameState(state)).toBe(hashState(state));
    expect(validateGameStateForDebug(state)).toEqual(validateGameState(state));
    expect(replayGameEvents(state, state.eventLog)).toEqual(
      replayEvents(state, state.eventLog),
    );

    expect(mandatoryDraw).toBeDefined();
    if (!mandatoryDraw) return;

    expect(
      applyGameAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: mandatoryDraw.actionId,
        clientKnownStateVersion: state.stateVersion,
      }),
    ).toEqual(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: mandatoryDraw.actionId,
        clientKnownStateVersion: state.stateVersion,
      }),
    );
  });

  it("keeps setup creation compatible through both entrypoints", () => {
    const state = createGame({
      seed: "arch-3-game-facade",
    });
    const legacyState = createLegacyGame({
      seed: "arch-3-game-facade",
    });
    const afterSetup = createGameAfterSetup({
      seed: "arch-3-game-facade-after-setup",
    });
    const legacyAfterSetup = createLegacyGameAfterSetup({
      seed: "arch-3-game-facade-after-setup",
    });

    expect(state).toEqual(legacyState);
    expect(afterSetup).toEqual(legacyAfterSetup);
  });
});
