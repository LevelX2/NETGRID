import type { ApplyActionOptions, GameEvent, GameState, PlayerAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  replayEvents as engineReplayEvents,
} from "../index";
import { createGame } from "./create-game";
import { hashState } from "./hash";
import { buildReplayEvents, replayGameEvents, type ReplayHost } from "./replay";

describe("game replay facade", () => {
  it("replays Engine events with the same end state and StateHash as the public API", () => {
    const initial = createGame({
      seed: "arch-58-replay-real-action",
      setupMode: "completed",
    });
    const mandatoryDraw = getLegalActions(initial, "corp").find(
      (action) => action.type === "mandatory_draw",
    );
    expect(mandatoryDraw).toBeDefined();
    if (!mandatoryDraw) return;

    const result = applyAction(initial, {
      matchId: initial.matchId,
      side: "corp",
      actionId: mandatoryDraw.actionId,
      clientKnownStateVersion: initial.stateVersion,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const replayedEvents = result.state.eventLog.slice(initial.eventLog.length);
    const replay = replayGameEvents(initial, replayedEvents);

    expect(replay).toEqual(engineReplayEvents(initial, replayedEvents));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(result.stateHash);
    expect(hashState(replay.state)).toBe(result.stateHash);
  });

  it("uses the configured ReplayHost action application in event order", () => {
    const initial = createGame({
      seed: "arch-58-replay-host-order",
      setupMode: "completed",
    });
    const action1 = replayAction(initial, "corp", "arch_58_action_1");
    const state1 = nextReplayState(initial, 1);
    const action2 = replayAction(state1, "corp", "arch_58_action_2");
    const state2 = nextReplayState(state1, 2);
    const calls: PlayerAction[] = [];
    const options: ApplyActionOptions[] = [];
    const host: ReplayHost = {
      actions: {
        applyAction: (_state, action, actionOptions) => {
          calls.push(action);
          options.push(actionOptions);
          const state = calls.length === 1 ? state1 : state2;
          return {
            ok: true,
            state,
            event: replayEvent(action, state),
            publicEvents: [],
            stateHash: hashState(state),
          };
        },
      },
    };

    const replay = buildReplayEvents(host, initial, [
      replayEvent(action1, state1),
      replayEvent(action2, state2),
    ]);

    expect(replay.ok).toBe(true);
    expect(calls).toEqual([action1, action2]);
    expect(options).toEqual([
      { publicEventsMode: "latest" },
      { publicEventsMode: "latest" },
    ]);
    expect(replay.actualFinalStateHash).toBe(hashState(state2));
  });

  it("keeps replay compatibility payload rejection stable", () => {
    const initial = createGame({
      seed: "arch-58-replay-invalid-payload",
      setupMode: "completed",
    });
    const event: GameEvent = {
      eventId: 2,
      type: "test_invalid_replay_payload",
      stateVersionBefore: 0,
      stateVersionAfter: 1,
      stateHashAfter: hashState(initial),
      publicPayload: { actor: "corp" },
      privatePayload: { corp: { action: { actionId: "missing_fields" } } },
    };

    const replay = replayGameEvents(initial, [event]);

    expect(replay.ok).toBe(false);
    expect(replay.errors).toEqual([
      "Event 2 has no replayable action.",
    ]);
  });

  it("rejects events whose ID does not match the state version", () => {
    const initial = createGame({
      seed: "replay-invalid-match-event-id",
      setupMode: "completed",
    });
    const event = replayEvent(
      replayAction(initial, "corp", "unused"),
      nextReplayState(initial, 1),
    );
    for (const invalidId of ["2", 0, 3]) {
      const replay = replayGameEvents(initial, [
        { ...event, eventId: invalidId } as GameEvent,
      ]);
      expect(replay.ok).toBe(false);
      expect(replay.errors).toEqual([
        "Invalid match event ID at state version 1.",
      ]);
    }
  });

  it("rejects a journal entry whose transition starts at a different state version", () => {
    const initial = createGame({ seed: "replay-invalid-transition", setupMode: "completed" });
    const draw = getLegalActions(initial, "corp").find((action) => action.type === "mandatory_draw")!;
    const result = applyAction(initial, replayAction(initial, "corp", draw.actionId));
    if (!result.ok) throw new Error(result.error.message);

    const replay = replayGameEvents(initial, [{ ...result.event, stateVersionBefore: 1 }]);

    expect(replay.ok).toBe(false);
    expect(replay.errors).toEqual(["Invalid state version transition at event 2."]);
    expect(replay.state.stateVersion).toBe(initial.stateVersion);
  });

  it("never falls back to direct action replay for an invalid randomized command", () => {
    const initial = createGame({
      seed: "arch-58-replay-invalid-randomized-command",
      setupMode: "completed",
    });
    const event: GameEvent = {
      eventId: 2,
      type: "test_invalid_randomized_replay_payload",
      stateVersionBefore: 0,
      stateVersionAfter: 1,
      stateHashAfter: hashState(initial),
      publicPayload: { actor: "corp" },
      privatePayload: {
        corp: {
          action: {
            kind: "engine_randomized_ice_install_selection",
            matchId: initial.matchId,
            side: "corp",
            actionId: "must_not_fall_back",
            clientKnownStateVersion: initial.stateVersion,
            quote: { complete: false },
          },
        },
      },
    };

    const replay = replayGameEvents(initial, [event]);

    expect(replay.ok).toBe(false);
    expect(replay.errors).toEqual([
      "Event 2 has no replayable action.",
    ]);
  });

  it("keeps invalid replay action failure behavior stable", () => {
    const initial = createGame({
      seed: "arch-58-replay-stale-action",
      setupMode: "completed",
    });
    const action = replayAction(initial, "corp", "arch_58_unknown_action");
    const event = replayEvent(action, nextReplayState(initial, 1));

    const replay = replayGameEvents(initial, [event]);

    expect(replay.ok).toBe(false);
    expect(replay.errors).toEqual([
      "Replay failed at 2: ERR_UNKNOWN_ACTION",
    ]);
  });

  it("rejects replay public payloads with hidden card lists before applying actions", () => {
    const initial = createGame({
      seed: "arch-58-replay-hidden-payload",
      setupMode: "completed",
    });
    const action = replayAction(initial, "corp", "arch_58_action_1");
    const event = {
      ...replayEvent(action, nextReplayState(initial, 1)),
      publicPayload: { actor: "corp", hqCardIds: "secret_card" },
    } as GameEvent;

    const replay = replayGameEvents(initial, [event]);

    expect(replay.ok).toBe(false);
    expect(replay.errors[0]).toContain("unsafe replay public payload");
  });
});

function replayAction(
  state: GameState,
  side: "corp" | "runner",
  actionId: string,
): PlayerAction {
  return {
    matchId: state.matchId,
    side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
  };
}

function nextReplayState(state: GameState, version: number): GameState {
  return {
    ...structuredClone(state),
    stateVersion: version,
  };
}

function replayEvent(
  action: PlayerAction,
  stateAfter: GameState,
): GameEvent {
  return {
    eventId: stateAfter.stateVersion + 1,
    type: "test_replay_action",
    stateVersionBefore: Math.max(0, stateAfter.stateVersion - 1),
    stateVersionAfter: stateAfter.stateVersion,
    stateHashAfter: hashState(stateAfter),
    publicPayload: { actor: action.side },
    privatePayload: { [action.side]: { action } },
  };
}
