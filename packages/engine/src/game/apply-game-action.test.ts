import type {
  ApplyActionOptions,
  EngineResult,
  GameState,
  PlayerAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { applyAction, getLegalActions } from "../index";
import {
  applyGameAction,
  buildApplyGameAction,
  configureApplyGameActionHost,
  type ApplyGameActionHost,
} from "./apply-game-action";
import { createGame } from "./create-game";
import { hashState } from "./hash";

describe("game apply-game-action facade", () => {
  it("matches the public Engine API for a simple legal action", () => {
    const state = createGame({
      seed: "arch-59-apply-game-action",
      setupMode: "completed",
    });
    const action = mandatoryDrawAction(state);

    expect(applyGameAction(state, action)).toEqual(applyAction(state, action));
  });

  it("delegates to the configured host exactly once", () => {
    const state = createGame({
      seed: "arch-59-apply-game-action-host",
      setupMode: "completed",
    });
    const action = mandatoryDrawAction(state);
    const calls: Array<{
      state: GameState;
      action: PlayerAction;
      options: ApplyActionOptions | undefined;
    }> = [];
    const expected = applyAction(state, action, { publicEventsMode: "latest" });
    const host: ApplyGameActionHost = {
      actions: {
        applyAction: (hostState, hostAction, options) => {
          calls.push({ state: hostState, action: hostAction, options });
          return expected;
        },
      },
    };

    expect(
      buildApplyGameAction(host, state, action, { publicEventsMode: "latest" }),
    ).toBe(expected);
    expect(calls).toEqual([
      {
        state,
        action,
        options: { publicEventsMode: "latest" },
      },
    ]);
  });

  it("keeps invalid and stale action behavior unchanged", () => {
    const state = createGame({
      seed: "arch-59-apply-game-action-invalid",
      setupMode: "completed",
    });
    const unknownAction: PlayerAction = {
      matchId: state.matchId,
      side: "corp",
      actionId: "arch_59_unknown_action",
      clientKnownStateVersion: state.stateVersion,
    };
    const staleAction = {
      ...mandatoryDrawAction(state),
      clientKnownStateVersion: state.stateVersion - 1,
    };

    expect(applyGameAction(state, unknownAction)).toEqual(
      applyAction(state, unknownAction),
    );
    expect(applyGameAction(state, staleAction)).toEqual(
      applyAction(state, staleAction),
    );
  });

  it("keeps EventLog, stateVersion and StateHash stable", () => {
    const state = createGame({
      seed: "arch-59-apply-game-action-statehash",
      setupMode: "completed",
    });
    const action = mandatoryDrawAction(state);
    const result = applyGameAction(state, action);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.stateVersion).toBe(state.stateVersion + 1);
    expect(result.state.eventLog).toHaveLength(state.eventLog.length + 1);
    expect(result.stateHash).toBe(hashState(result.state));
    expect(result.event.stateHashAfter).toBe(result.stateHash);
  });

  it("throws clearly without a configured default host", () => {
    const state = createGame({
      seed: "arch-59-apply-game-action-unconfigured",
      setupMode: "completed",
    });
    const action = mandatoryDrawAction(state);

    configureApplyGameActionHost(undefined);
    try {
      expect(() => applyGameAction(state, action)).toThrow(
        "ApplyGameAction-Host ist nicht initialisiert.",
      );
    } finally {
      configureApplyGameActionHost({
        actions: {
          applyAction,
        },
      });
    }
  });
});

function mandatoryDrawAction(state: GameState): PlayerAction {
  const legalAction = getLegalActions(state, "corp").find(
    (action) => action.type === "mandatory_draw",
  );
  if (!legalAction) throw new Error("Missing mandatory draw action.");
  return {
    matchId: state.matchId,
    side: "corp",
    actionId: legalAction.actionId,
    clientKnownStateVersion: state.stateVersion,
  };
}
